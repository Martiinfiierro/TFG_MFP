import { Component, ViewEncapsulation, inject, EventEmitter, Output, Inject, ViewChild } from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';

interface NodeData{
  id: any,
  tipo_nodo: any,
  nombre: any,
  puerto: any,
  url: any,
  geolocalizacion: any
}

@Component({
    selector: 'dialogDatos',
    templateUrl: './dialog.html',
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
          this.nodo = data.nodo;
        },
        (error) => {
          console.error('Error al obtener el nodo', error);
        }
      );
    }
  
  }