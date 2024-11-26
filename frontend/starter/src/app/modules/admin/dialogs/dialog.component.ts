import { Component, ViewEncapsulation, inject, EventEmitter, Output, Inject, ViewChild } from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { ConfigService } from 'app/services/config.service';
import { Config } from 'app/services/config.service';
import { NodeData } from '../lista/lista.component';

@Component({
    selector: 'dialogDatos',
    templateUrl: './dialog.html',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
      MatDialogTitle,
      MatDialogContent,
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
    configuracion: Config;
    estado_interno: any;
  
    constructor(private http: GrafoService, private config: ConfigService, @Inject(MAT_DIALOG_DATA) private data: any) {
    }
  
    cerrarDialog(): void {
      this.dialogRef.close();
    }

    ngOnDestroy(): void {
      this.actualizarTiempo();
    }

    async actualizarTiempo(){
      const nodoAct = {
        id: this.nodo.id,
        tipo_nodo: this.nodo.tipo_nodo,
        nombre: this.nodo.nombre,
        url: this.nodo.url,
        puerto: this.nodo.puerto,
        latitud: this.nodo.latitud,
        longitud: this.nodo.longitud,
        visible: this.nodo.visible,
        tiempo: new Date(),
      }
      try {
        await this.http.putNodo(nodoAct);
      } catch (error) {
        console.error('Error al actualizar la visibilidad del nodo', error);
      }
    }

    initConfig(){
      this.config.getConfig().subscribe((res: any) => {
        this.configuracion = res;
      });
    }

    getEstadoInterno(){
      console.log(this.data)
      this.http.readDebug(`${this.data.url}:${this.data.puerto}`).subscribe((res: any) => {
          console.log(res)
          this.estado_interno = JSON.stringify(res, null, 2);
      })
    }
  
    ngOnInit(): void {
      this.getEstadoInterno();
      this.initConfig();
      this.tipo = this.data.tipo;
      this.http.getNodo(this.data.id).subscribe(
        (data) => {
          this.nodo = data.nodo;
        },
        (error) => {
          console.error('Error al obtener el nodo', error);
        }
      );
    }
  }