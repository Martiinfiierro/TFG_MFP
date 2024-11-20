import { Component, ViewEncapsulation, inject, Inject} from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { Dialog } from '../dialogs/dialog.component';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { timer } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import * as L from 'leaflet';
import 'leaflet-polylinedecorator';
import { ConfigService } from 'app/services/config.service';
import { Config } from 'app/services/config.service';
@Component({
    selector     : 'mapa',
    standalone   : true,
    templateUrl  : './mapa.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
      MatTableModule, 
      MatToolbarModule, 
      MatIconModule, 
      MatInputModule, 
      MatPaginatorModule, 
      MatButtonToggleModule,
      MatButtonModule,
      CommonModule
    ]
})
export class MapaComponent{
  //Dialogo
  readonly dialog = inject(MatDialog);
  configuracion: Config;
  datosDelNodo: any;
  activarConexiones: boolean = true;
  timerSubscription: any;

  constructor(private http: GrafoService, private config: ConfigService, private router: Router) { }

  map!: L.Map;

  ngOnInit(): void{
    this.initConfig();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
        this.timerSubscription = null;
    }
}

  initConfig(){
    this.config.getConfig().subscribe((res: any) => {
        this.configuracion = res;
        this.initMap();
    });
  }

  comprobar(){
    this.http.getNodos().subscribe((res: any) =>{
    const requests = res.nodos.map((nodo: any) => 
        this.http.readDebug(nodo.url).pipe(
            map((val: any) => ({
                nodo: nodo,
                datos: val,
                status: true
            })),
            catchError(() => of({
                nodo: nodo,
                datos: '',
                status: false
            }))
        )
    );
    forkJoin(requests).subscribe((res: any) => {
        let cont = 0;
        if(!this.datosDelNodo){
          console.log("primera carga");
          this.updateMapa(res);
        }
        else{
          for(let x = 0; x < res.length; x++){
              const obj1 = JSON.stringify(res[x].nodo);
              const obj2 = JSON.stringify(this.datosDelNodo[x].nodo);
  
              if (obj1 !== obj2 || res[x].status !== this.datosDelNodo[x].status) {
                  cont++;
              }
          }
          if(cont !== 0){
              console.log("numero de cambios: " + cont)
              this.updateMapa(res);
          } else{
              console.log('no hay cambios')
          }
        }
      });
    });
    this.timerSubscription = timer(this.configuracion.espera.valor).subscribe(() => this.comprobar());
  }

  updateMapa(res: any){
    res.map((item: any) => {
      if(item.nodo.visible){
        let iconUrl = '';
        if(!item.status){
          iconUrl = 'assets/map/ordenador-gris.png';
        }
        else{
          iconUrl = 'assets/map/ordenador.png';
        }
        const customIcon = L.icon({
          iconUrl: iconUrl,
          iconSize: [30, 30],
          iconAnchor: [22, 41],
          popupAnchor: [1, -34]
        })
        const marker = L.marker([item.nodo.latitud, item.nodo.longitud], { icon: customIcon }).addTo(this.map);

        
        const { nodo, status } = item;
        const { nombre, tipo_nodo } = nodo;
        nodo.nombre = tipo_nodo === 'Balanceador' && nombre === 'main' ? this.configuracion.balancer.nameMain : 
            tipo_nodo === 'Balanceador' && nombre === 'subs' ? this.configuracion.balancer.nameSubs : 
            tipo_nodo === 'Controlador' && nombre === 'main' ? this.configuracion.controller.nameMain : 
            tipo_nodo === 'Controlador' && nombre === 'subs' ? this.configuracion.controller.nameSubs : nodo.nombre;
        marker.bindTooltip(nodo.nombre, { 
          permanent: true, 
          direction: 'bottom',
          offset: [-7, -12]  
        });
        marker.on('click', () => this.dialogo(item.nodo.tipo_nodo, item.nodo.id, item.nodo.url));
      }
    });
    this.datosDelNodo = res;
  }

  initMap(): void {
    this.map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.comprobar();
  }

  //Botones

    irAGrafo(): void {
        this.router.navigate(['/grafo']);
    }

    irALista(): void {
      this.router.navigate(['/lista']);
  }

    dialogo(tipo: any, id: any, url: any): void {
      const dialogRef = this.dialog.open(Dialog, {
        data: {
          id: id,
          tipo: tipo,
          url: url
        }
      });
    }
}