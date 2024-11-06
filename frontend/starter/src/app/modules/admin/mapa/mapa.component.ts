import { Component, ViewEncapsulation, inject, EventEmitter, Output, Inject, ViewChild } from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { timer } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import * as L from 'leaflet';

// Define la interfaz para los elementos de la tabla
export interface NodeData {
  id: number,
  tipo_nodo: string;
  nombre: string;
  url: string;
  puerto: string;
  latitud: string;
  longitud: string;
}

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
  readTime = 3000;

  constructor(private http: GrafoService, private router: Router) { }

  map!: L.Map;

  ngOnInit(): void {
    this.initMap();
    this.cargarNodos();
  }

  cargarNodos(){
    this.http.getNodos().subscribe((res: any) => {
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
      forkJoin(requests).subscribe((res2: any) => {
        console.log(res2)
        res2.map((item: any) => {
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
            marker.bindTooltip(item.nodo.nombre, { 
              permanent: true, 
              direction: 'bottom',
              offset: [-7, -12]  
            });
            marker.on('click', () => this.dialogo(item.nodo.tipo_nodo, item.nodo.id));
          }
        })
      })
    });
    timer(this.readTime).subscribe(() => this.cargarNodos());
  }

  initMap(): void {
    this.map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  //Botones

    irAGrafo(): void {
        this.router.navigate(['/grafo']);
    }

    irALista(): void {
      this.router.navigate(['/lista']);
  }

    dialogo(tipo: any, id: any): void {
      const dialogRef = this.dialog.open(Dialog, {
        data: {
          id: id,
          tipo: tipo
        }
      });
    }
}

@Component({
  selector: 'dialogDatos',
  templateUrl: '../dialogs/dialog.html',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    MatGridListModule,
    MatButtonModule,
    CommonModule
  ],
})

export class Dialog{
  readonly dialogRef = inject(MatDialogRef<Dialog>);
  nodo: NodeData;
  tipo: any;

  constructor(private http: GrafoService, @Inject(MAT_DIALOG_DATA) private data: any) {
  }

  cerrarDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.tipo = this.data.tipo;
    this.http.getNodo(this.data.id).subscribe(
      (data) => {
        console.log(this.data)
        this.nodo = data.nodo;
      },
      (error) => {
        console.error('Error al obtener el nodo', error);
      }
    );
  }
}