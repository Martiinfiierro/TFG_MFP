import { Component, ViewEncapsulation } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

@Component({
    selector     : 'grafo',
    standalone   : true,
    templateUrl  : './grafo.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [MatButtonToggleModule, MatIconModule, MatToolbarModule, MatCheckboxModule]
})
export class GrafoComponent
{
    constructor(private router: Router) {}

    irALista(): void {
        this.router.navigate(['/lista']); // Navega a la ruta 'grafo'
    }
}
