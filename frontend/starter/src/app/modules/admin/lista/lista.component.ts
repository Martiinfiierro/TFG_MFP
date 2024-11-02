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
    selector     : 'lista',
    standalone   : true,
    templateUrl  : './lista.component.html',
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
export class ListaComponent{

  //Lista
  listaNodos: NodeData[] = [];
  displayedColumns: string[] = ['tipo_nodo', 'url', 'puerto', 'nombre', 'geolocalizacion', 'actions'];
  dataSource = new MatTableDataSource<NodeData>(this.listaNodos);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  //Dialogo
  readonly dialog = inject(MatDialog);


  constructor(private http: GrafoService, private router: Router) { }

  ngOnInit(): void {
    this.getNodos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  getNodos(){
    this.http.getNodos()
      .subscribe((result) =>{
        this.actualizarDataSource(result.nodos);
    });
  }

  actualizarDataSource(nodos: NodeData[]) {
    this.listaNodos = nodos;
    this.dataSource.data = this.listaNodos;
  }

  //Botones

    irAGrafo(): void {
        this.router.navigate(['/grafo']);
    }

    dialogo(tipo: any, id: any): void {
      const dialogRef = this.dialog.open(Dialog, {
        data: {
          id: id,
          tipo: tipo
        }
      });
    }

    anadirNodo(): void {
      const dialogRef = this.dialog.open(AnadirNodo, {
      });

      dialogRef.componentInstance.dialogClosed.subscribe(() => {
        this.getNodos();
      });
    }
    
    descargar(): void {
      // Llama al servicio para obtener los datos
      this.http.getNodos().subscribe(
        (data) => {
          // Convierte los datos a una cadena JSON
          const jsonData = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
  
          // Crea un enlace temporal para descargar el archivo
          const a = document.createElement('a');
          a.href = url;
          a.download = 'listaNodos.json';
          a.click();
  
          // Limpia la URL del objeto
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Error al descargar el JSON:', error);
        }
      );
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
@Component({
  selector: 'dialogDatos',
  templateUrl: '../dialogs/anadirNodo.html',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    CommonModule,
    MatDialogModule,
    FormsModule
  ],
})

export class AnadirNodo{
  @Output() dialogClosed = new EventEmitter<void>();

  options = [
    { value: 'Balanceador', viewValue: 'Balanceador' },
    { value: 'Controlador', viewValue: 'Controlador' },
    { value: 'Procesador', viewValue: 'Procesador' },
  ];

  tipoNodo: string;
  puerto: string;
  url: string;
  nombre: string;
  latitud: string;
  longitud: string;

  readonly dialogRef = inject(MatDialogRef<AnadirNodo>);

  constructor(private http: GrafoService){}

  async anadirNodo(){
    const nodoData = {
      tipo_nodo: this.tipoNodo,
      nombre: this.nombre,
      url: this.url,
      puerto: this.puerto,
      latitud: this.latitud,
      longitud: this.longitud
    }
    await this.http.postNodo(nodoData);
    this.cerrarDialog();
  }

  cerrarDialog(): void {
    this.dialogClosed.emit();
    this.dialogRef.close();
  }
}