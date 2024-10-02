import { Component, ViewEncapsulation } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';

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
    imports: [MatTableModule, MatToolbarModule, MatIconModule, MatInputModule, MatPaginatorModule]
})
export class ListaComponent
{
    displayedColumns: string[] = ['tipo_nodo', 'url', 'puerto', 'nombre', 'geo', 'actions'];
    dataSource = ELEMENT_DATA;
}
