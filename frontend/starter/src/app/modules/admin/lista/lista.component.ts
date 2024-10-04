import { Component, ViewEncapsulation, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
export interface PeriodicElement {
  tipo_nodo: string;
  url: string;
  puerto: string;
  nombre: string;
  geo: string;
}

// Datos de ejemplo
const ELEMENT_DATA: PeriodicElement[] = [
  { tipo_nodo: 'controlador', url: 'localhost:3000', puerto: '3000', nombre:'Controlador 1', geo: 'X' },
  { tipo_nodo: 'procesador', url: 'localhost:3001', puerto: '3001', nombre:'Procesador 1', geo: 'Y' },
  { tipo_nodo: 'balanceador', url: 'localhost:3002', puerto: '3002', nombre:'Balanceador 1', geo: 'Z' },
];

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
      MatButtonModule
    ]
})
export class ListaComponent
{
    //Lista
    displayedColumns: string[] = ['tipo_nodo', 'url', 'puerto', 'nombre', 'geo', 'actions'];
    dataSource = ELEMENT_DATA;

    //Dialogo
    readonly dialog = inject(MatDialog);

    constructor(private router: Router) {}

    irAGrafo(): void {
        this.router.navigate(['/grafo']); // Navega a la ruta 'grafo'
    }

    dialogoControlador(): void {
      const dialogRef = this.dialog.open(DialogControlador, {
      });
    }

    dialogoProcesador(): void {
      const dialogRef = this.dialog.open(DialogProcesador, {
      });
    }

    dialogoBalanceador(): void {
      const dialogRef = this.dialog.open(DialogBalanceador, {
      });
    }

    anadirNodo(): void {
      const dialogRef = this.dialog.open(AnadirNodo, {
      });
    }
}

@Component({
  selector: 'dialogDatos',
  templateUrl: './dialogControlador.html',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    MatGridListModule,
    MatButtonModule
  ],
})

export class DialogControlador{
  readonly dialogRef = inject(MatDialogRef<DialogControlador>);

  cerrarDialog(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'dialogDatos',
  templateUrl: './dialogProcesador.html',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    MatGridListModule,
    MatButtonModule
  ],
})

export class DialogProcesador {
  readonly dialogRef = inject(MatDialogRef<DialogProcesador>);

  cerrarDialog(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'dialogDatos',
  templateUrl: './dialogBalanceador.html',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    MatGridListModule,
    MatButtonModule
  ],
})

export class DialogBalanceador {
  readonly dialogRef = inject(MatDialogRef<DialogBalanceador>);

  cerrarDialog(): void {
    this.dialogRef.close();
  }
}
@Component({
  selector: 'dialogDatos',
  templateUrl: './anadirNodo.html',
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
    MatButtonModule
  ],
})

export class AnadirNodo{
  readonly dialogRef = inject(MatDialogRef<AnadirNodo>);

  cerrarDialog(): void {
    this.dialogRef.close();
  }
}