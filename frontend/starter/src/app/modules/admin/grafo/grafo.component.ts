import { Component, ViewEncapsulation} from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { Dialog } from '../dialogs/dialog.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as echarts from 'echarts';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators'
interface GrafoData {
    nodo: any;
    datos: any;
    status: any;
}
@Component({
    selector     : 'grafo',
    standalone   : true,
    templateUrl  : './grafo.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [MatButtonToggleModule, MatIconModule, MatToolbarModule, MatCheckboxModule, MatDialogModule]
})

export class GrafoComponent{
    //Variables temporizador
    readTime = 3000;
    idTimer: any;
  
    myChart: any = null;

    constructor(private router: Router, private http: GrafoService, private dialog: MatDialog) {}

    irALista(): void {
        this.router.navigate(['/lista']); // Navega a la ruta 'grafo'
    }

    dialogo(tipo: any, id: any): void {
        const dialogRef = this.dialog.open(Dialog, {
          data: {
            id: id,
            tipo: tipo
          }
        });
    }

    ngOnInit(){
        this.initChart();
    }
    
    updateGrafo() {
        this.http.getNodos().subscribe((res) =>{
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
                this.myChart.setOption({
                    series: [
                        {
                            data: res.map((item: any) => {
                                const { nodo, status } = item;
                                const { tipo_nodo } = nodo;
            
                                const symbol = tipo_nodo === 'Balanceador' ? 'square' : tipo_nodo === 'Controlador' ? 'circle' : 'diamond';
                                const size = tipo_nodo === 'Procesador' ? 35 : 50;
                                let color = tipo_nodo === 'Balanceador' ? '#1E90FF' : tipo_nodo === 'Controlador' ? '#FFA500' : '#A75DB3';
            
                                if (!status) {
                                    color = this.grey(color);
                                }
            
                                return { 
                                    name: nodo.nombre, 
                                    symbolSize: size, 
                                    symbol, 
                                    itemStyle: { color }, 
                                    tipo_nodo, 
                                    id: nodo.id 
                                };
                            })
                        }
                    ]
                });
                timer(this.readTime).subscribe(() => this.updateGrafo());
            });
        });
    } 

    initChart(): void {
        this.http.getNodos().subscribe((res) =>{
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
            forkJoin(requests).subscribe((data: any) => {
                console.log(data); 
                const chartDom = document.getElementById('grafo');
                this.myChart = echarts.init(chartDom!);
        
                const option = {
                    tooltip: {},
                    series: [
                        {
                            type: 'graph',
                            layout: 'force',
                            force: {
                                repulsion: 500,
                                edgeLength: [50, 200]
                            },
                            roam: true,
                            scaleLimit: {
                                min: 0.5,
                                max: 2
                            },
                            label: {
                                show: true,
                                position: 'inside'
                            },
                            data: data.map((res: any) => {
                                let { nodo, status } = res;
                                let { tipo_nodo } = nodo;
                                let symbol = tipo_nodo === 'Balanceador' ? 'square' : tipo_nodo === 'Controlador' ? 'circle' : 'diamond';
                                let size = tipo_nodo === 'Procesador' ? 35 : 50;
                                let color = tipo_nodo === 'Balanceador' ? '#1E90FF' : tipo_nodo === 'Controlador' ? '#FFA500' : '#A75DB3'
                                if(!status){
                                    color = this.grey(color);
                                }
        
                                return { 
                                    name: nodo.nombre, 
                                    symbolSize: size, 
                                    symbol, 
                                    itemStyle: { 
                                        color 
                                    }, 
                                    tipo_nodo, 
                                    id: nodo.id 
                                };
                            }),
                            lineStyle: {
                                color: 'source',
                                curveness: 0.7
                            }
                        }
                    ]
                };
            
                // Establece las opciones del gráfico
                this.myChart.setOption(option);
            
                // Manejar clic en los nodos
                this.myChart.on('click', (params) => {
                    if (params.dataType === 'node') {
                        const nodoId = (params.data as any).id;
                        const tipoNodo = (params.data as any).tipo_nodo;
        
                        this.dialogo(tipoNodo, nodoId);
                    }
                });

                this.updateGrafo();
            });
        });
    }

    grey(hexColor: any) {
        // Convertir el color hexadecimal a RGB
        const rgb = parseInt(hexColor.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >>  8) & 0xff;
        const b = (rgb >>  0) & 0xff;
    
        // Calcular el gris como un promedio ponderado de los componentes RGB
        const grayValue = Math.round((r * 0.3) + (g * 0.59) + (b * 0.11));
        
        // Definir el nuevo color grisáceo, incrementando la influencia del gris
        const newColor = {
            r: Math.round((r + grayValue * 0.1) / 2),  // 80% del gris
            g: Math.round((g + grayValue * 0.1) / 2),  // 80% del gris
            b: Math.round((b + grayValue * 0.1) / 2),  // 80% del gris
        };
        
        // Convertir el color de nuevo a formato hexadecimal
        const rgbToHex = (r:any, g:any, b:any) => {
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        };
    
        return rgbToHex(newColor.r, newColor.g, newColor.b);
    }
}