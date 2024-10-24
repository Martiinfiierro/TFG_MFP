import { Component, ViewEncapsulation, inject, Inject } from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { Dialog } from '../dialogs/dialog.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
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
import { MatButtonModule } from '@angular/material/button';
import * as echarts from 'echarts';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface NodeData {
    id: number,
    tipo_nodo: string;
    nombre: string;
    url: string;
    puerto: string;
    geolocalizacion: string;
    status: boolean;
}

interface GrafoData {
    nodo: any;
    nodoState: any;
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
    // States to show
    mainBalancerState = {
        UID: '', Type: '', Operation: '', Data: {
        UID: '0', balancerSubsActive: false, balancerMainMaxAYA: 0, receivedMessages: 0,
        internalConfig: {
            port: 3100,
            type: "main",
            urlMain: ""
        },
        balancerList: []
        }
    };

    subsBalancerState = {
        UID: '', Type: '', Operation: '', Data: {
        UID: '0', balancerSubsActive: false, balancerMainMaxAYA: 0, receivedMessages: 0,
        internalConfig: {
            port: 3100,
            type: "main",
            urlMain: ""
        },
        balancerList: []
        }
    };

    mainCoordinatorState = {
        UID: '', Type: '', Operation: '', Data: {
        UID: '0', balancerList: [], coordinatorMainMaxAYA: 0, coordinatorSubsActive: false, processorsList: [],
        internalConfig: {
            port: 0,
            type: "main",
            urlBalancerMain: "http://127.0.001:3100",
            urlBalancerSubs: "http://127.0.001:3101",
            urlCoordinatorlMain: ""
        },
        receivedMessages: 0
        }
    };

    subsCoordinatorState = {
        UID: '', Type: '', Operation: '', Data: {
        UID: '0', balancerList: [], coordinatorMainMaxAYA: 0, coordinatorSubsActive: false, processorsList: [],
        internalConfig: {
            port: 0,
            type: "main",
            urlBalancerMain: "http://127.0.001:3100",
            urlBalancerSubs: "http://127.0.001:3101",
            urlCoordinatorlMain: ""
        },
        receivedMessages: 0
        }
    };

    // Creamos un array de procesadores con una estructura interna de procesador
    numProcessors = 3;
    processorsState = Array(this.numProcessors).fill({
        UID: "",
        Type: "",
        Operation: "",
        Data: {
        UID: "",
        internalConfig: {
            name: "",
            port: 0,
            capacity: 0,
            preference: 0,
            urlCoordinatorMain: "",
            urlCoordinatorSubs: ""
        }
        }
    });

    componentsStatus = {
        mainBalancer: false,
        subsBalancer: false,
        mainCoordinator: false,
        subsCoordinator: false,
        processors: Array(this.numProcessors).fill(false)
    }

    localhost = 'http://localhost'
    config = {
        balancerMain: { baseurl: this.localhost, port: 3100, url: this.localhost + ":3100" },
        balancerSubs: { baseurl: this.localhost, port: 3101, url: this.localhost + ":3101" },
        coordinatorMain: { baseurl: this.localhost, port: 3000, url: this.localhost + ":3000" },
        coordinatorSubs: { baseurl: this.localhost, port: 3001, url: this.localhost + ":3001" },
        processor: [{ baseurl: '', port: 0, url: '' }]
    }

    myChart: any = null;

    //Variables temporizador
    readTime = 3000;
    idTimer: any;

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

    ngOnInit(): void {
        this.iniProccesors();
        this.updateMainBalancerState();
        this.updateSubsBalancerState();
        this.updateMainCoordinatorState();
        this.updateSubsCoordinatorState();
        
        Promise.all(this.config.processor.map((element, index) => this.updateProcessors(index)));
    
        this.updateGrafo();
    }

    async updateGrafo(){
        this.http.getNodos().subscribe( data => {
            let datosNodos: GrafoData[] = [];
            let j = 0;

            for(let i = 0; i < data.nodos.length; i++){
                switch (true) {
                    case (data.nodos[i].nombre == 'main' && data.nodos[i].tipo_nodo == 'Balanceador'):
                        datosNodos.push({
                            nodo: data.nodos[i], 
                            nodoState: this.mainBalancerState, 
                            status: this.componentsStatus.mainBalancer
                        });
                        break;
                    case (data.nodos[i].nombre == 'subs' && data.nodos[i].tipo_nodo == 'Balanceador'):
                        datosNodos.push({
                            nodo: data.nodos[i], 
                            nodoState: this.subsBalancerState, 
                            status: this.componentsStatus.subsBalancer
                        });
                        break;
                    case (data.nodos[i].nombre == 'main' && data.nodos[i].tipo_nodo == 'Controlador'):
                        datosNodos.push({
                            nodo: data.nodos[i], 
                            nodoState: this.mainCoordinatorState, 
                            status: this.componentsStatus.mainCoordinator
                        });
                        break;
                    case (data.nodos[i].nombre == 'subs' && data.nodos[i].tipo_nodo == 'Controlador'):
                        datosNodos.push({
                            nodo: data.nodos[i], 
                            nodoState: this.subsCoordinatorState, 
                            status: this.componentsStatus.subsCoordinator
                        });
                        break;
                    case (data.nodos[i].tipo_nodo == 'Procesador'):
                        let found = false;
                        for (j; j < this.processorsState.length && !found; j++) {
                            if (data.nodos[i].nombre == this.processorsState[j].Data.internalConfig.name) {
                                datosNodos.push({
                                    nodo: data.nodos[i],
                                    nodoState: this.processorsState[j],
                                    status: this.componentsStatus.processors[j]
                                });
                                found = true;
                            }
                            else{
                                datosNodos.push({
                                    nodo: data.nodos[i],
                                    nodoState: '',
                                    status: this.componentsStatus.processors[j]
                                });
                                found = true;
                            }
                        }
                        break;
                    default:
                        console.log("Ninguna condición se cumplió");
                        break;
                }
            }
            if (this.myChart) {
                this.myChart.setOption({
                    series: [{
                        data: datosNodos.map((res: any) => {
                            let { nodo, status } = res;
                            let { tipo_nodo } = nodo;
                            let symbol = tipo_nodo === 'Balanceador' ? 'square' : tipo_nodo === 'Controlador' ? 'circle' : 'diamond';
                            let size = tipo_nodo === 'Procesador' ? 35 : 50;
                            let color = tipo_nodo === 'Balanceador' ? '#1E90FF' : tipo_nodo === 'Controlador' ? '#FFA500' : '#A75DB3'
                            if (!status) {
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
                        })
                    }]
                });
            }
            else{
                this.initChart(datosNodos);
            }
            timer(this.readTime).subscribe(() => this.updateGrafo());
        });
    }   

    initChart(data: any): void {
        const chartDom = document.getElementById('grafo'); // Asigna el elemento del HTML con id="grafo"
        this.myChart = echarts.init(chartDom!); // Asegura que el elemento no sea nulo

        // Define las opciones del gráfico
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

    async anadirNodo(nodoData: any, url: any, tipo: any){
        let body: any;
        if(tipo == 'Balanceador'){
            body = {
                tipo_nodo: tipo,
                nombre: nodoData.Data.internalConfig.type,
                url: url,
                puerto: nodoData.Data.internalConfig.port,
                geolocalizacion: 'N/A'
            }
        }
        else if(tipo == 'Controlador'){
            body = {
                tipo_nodo: tipo,
                nombre: nodoData.Data.internalConfig.type,
                url: url,
                puerto: nodoData.Data.internalConfig.port,
                geolocalizacion: 'N/A'
            }
        }
        else if(tipo == 'Procesador'){
            body = {
                tipo_nodo: tipo,
                nombre: nodoData.Data.internalConfig.name,
                url: url,
                puerto: nodoData.Data.internalConfig.port,
                geolocalizacion: 'N/A'
            }
        }
        await this.http.postNodo(body);
    }

    iniProccesors() {
        const iniPort = 4001;
        this.config.processor.splice(0, this.config.processor.length);
        for (let i = 0; i < this.numProcessors; i++) {
            const newO = { 
                baseurl: this.localhost, port: Number(iniPort + i), 
                url: this.localhost + ":" + Number(iniPort + i) 
            }
            this.config.processor.push(newO);
        }
    }

    updateProcessors(i:any) {
        this.http.readDebug(this.config.processor[i].url).subscribe({
            next: (val: any) => {
            this.componentsStatus.processors[i] = true;
            this.processorsState[i] = val;
            this.anadirNodo(this.processorsState[i], this.config.processor[i].url, 'Procesador');
            timer(this.readTime).subscribe(() => this.updateProcessors(i));

            },
            error: (err) => {
            this.componentsStatus.processors[i] = false;
            // Volvemos a programar la lectura
            timer(this.readTime).subscribe(() => this.updateProcessors(i));
            }
        });
    }

    // Actualizar estado de mainBlanacer
    updateMainBalancerState() {
        this.http.readDebug(this.config.balancerMain.url).subscribe({
        next: (val: any) => {
            this.componentsStatus.mainBalancer = true;
            this.mainBalancerState = val;
            this.anadirNodo(this.mainBalancerState, this.config.balancerMain.url, 'Balanceador');
            timer(this.readTime).subscribe(() => this.updateMainBalancerState());

        },
        error: (err) => {
            this.componentsStatus.mainBalancer = false;
            timer(this.readTime).subscribe(() => this.updateMainBalancerState());
        }
        });
    }

    // Actualizar estado de subsBalancer
    updateSubsBalancerState() {
        this.http.readDebug(this.config.balancerSubs.url).subscribe({
        next: (val: any) => {
            this.componentsStatus.subsBalancer = true;
            this.subsBalancerState = val;
            this.anadirNodo(this.subsBalancerState, this.config.balancerSubs.url, 'Balanceador');
            // Volvemos a programar la lectura
            timer(this.readTime).subscribe(() => this.updateSubsBalancerState());

        },
        error: (err) => {
            this.componentsStatus.subsBalancer = false;
            timer(this.readTime).subscribe(() => this.updateSubsBalancerState());
        }
        }
        );
    }

    // Actualizar estado de mainCoordinator
    updateMainCoordinatorState() {
        this.http.readDebug(this.config.coordinatorMain.url).subscribe({
        next: (val: any) => {
            this.componentsStatus.mainCoordinator = true;
            this.mainCoordinatorState = val;
            this.anadirNodo(this.mainCoordinatorState, this.config.coordinatorMain.url, 'Controlador');
            // Volvemos a programar la lectura
            timer(this.readTime).subscribe(() => this.updateMainCoordinatorState());

        },
        error: (err) => {
            this.componentsStatus.mainCoordinator = false;
            // Volvemos a programar la lectura
            timer(this.readTime).subscribe(() => this.updateMainCoordinatorState());
        }
        }
        );
    }

    // Actualizar estado subsCoordinator
    updateSubsCoordinatorState() {
        this.http.readDebug(this.config.coordinatorSubs.url).subscribe({
        next: (val: any) => {
            this.componentsStatus.subsCoordinator = true;
            this.subsCoordinatorState = val;
            this.anadirNodo(this.subsCoordinatorState, this.config.coordinatorSubs.url, 'Controlador');
            // Volvemos a programar la lectura
            timer(this.readTime).subscribe(() => this.updateSubsCoordinatorState());

        },
        error: (err) => {
            this.componentsStatus.subsCoordinator = false;
            // Volvemos a programar la lectura
            timer(this.readTime).subscribe(() => this.updateSubsCoordinatorState());
            }
        });
    }
}