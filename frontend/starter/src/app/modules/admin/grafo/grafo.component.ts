import { Component, ViewEncapsulation} from '@angular/core';
import { GrafoService } from 'app/services/grafo.service';
import { Dialog } from '../dialogs/dialog.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { timer} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as echarts from 'echarts';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from 'app/services/config.service';
import { Config } from 'app/services/config.service';
@Component({
    selector     : 'grafo',
    standalone   : true,
    templateUrl  : './grafo.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [MatButtonToggleModule, MatIconModule, MatToolbarModule, MatCheckboxModule, MatDialogModule]
})

export class GrafoComponent{
    //Variables temporizador
    configuracion: Config;
    activarConexiones: boolean = true;
    myChart: any = null;
    datosDelSistema: any;
    timerSubscription: any;

    ancho = 500;
    alto = 150;
    margenZona = 10;

    zonas = {
        "Controlador": { xInicio: 0, xFin: 0.2 * this.ancho },
        "Balanceador": { xInicio: 0.25 * this.ancho, xFin: 0.4 * this.ancho },
        "Procesador": { xInicio: 0.45 * this.ancho, xFin: this.ancho }
    };

    constructor(private router: Router, private http: GrafoService, private config: ConfigService, private dialog: MatDialog) {}

    irALista(): void {
        this.router.navigate(['/lista']);
    }

    irAMapa():void{
        this.router.navigate(['/mapa']);
    }

    dialogo(tipo: any, id: any, url: any, puerto: any): void {
        const dialogRef = this.dialog.open(Dialog, {
          data: {
            id: id,
            tipo: tipo,
            url: url,
            puerto: puerto
          }
        });
    }

    initConfig(){
        this.config.getConfig().subscribe((res: any) => {
            this.configuracion = res;
        });
    }

    ngOnInit(){
        this.initConfig();
        this.initChart();
    }

    ngOnDestroy(): void {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
        }
    }

    conexiones(event: any){
        this.activarConexiones = !event.checked;
        if(!this.activarConexiones){
            console.log('desactivar conexiones')
            this.myChart.setOption({
                series: [{
                    links: [],
                }]
            })
        }
        else{
            this.http.getNodosOrdenados().subscribe((res: any) =>{
                const requests = res.nodos.map((nodo: any) => 
                    this.http.readDebug(`${nodo.url}:${nodo.puerto}`).pipe(
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
                    this.updateGrafo(res);
                });
            });
        }
    }

    comprobar(){
        this.http.getNodosOrdenados().subscribe((res: any) =>{
        const requests = res.nodos.map((nodo: any) => 
            this.http.readDebug(`${nodo.url}:${nodo.puerto}`).pipe(
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
            
            for(let x = 0; x < res.length; x++){
                const obj1 = JSON.stringify(res[x].nodo);
                const obj2 = JSON.stringify(this.datosDelSistema[x].nodo);

                if (obj1 !== obj2 || res[x].status !== this.datosDelSistema[x].status) {
                    cont++;
                }
            }
            if(cont !== 0){
                console.log("cambios: " + cont)
                this.updateGrafo(res);
            }
        });
    });
    
        this.timerSubscription = timer(this.configuracion.espera.valor).subscribe(() => this.comprobar());
    }

    updateGrafo(res: any) {
        const data = res.map((item: any) => {
            const { nodo, status } = item;
            const { nombre, tipo_nodo } = nodo;
            
            let image = tipo_nodo === 'Balanceador Main' ? this.configuracion.balancer.pngMain : 
                tipo_nodo === 'Controlador Main' ? this.configuracion.controller.pngMain : 
                tipo_nodo === 'Balanceador Subs' ? this.configuracion.balancer.pngSubs : 
                tipo_nodo === 'Controlador Subs' ? this.configuracion.controller.pngSubs : 
                this.configuracion.processor.png;
            const size = tipo_nodo === 'Balanceador' ? this.configuracion.balancer.size : tipo_nodo === 'Controlador' ? this.configuracion.controller.size : this.configuracion.processor.size;
            if (!status) {
                image = tipo_nodo === 'Balanceador Main' ? this.configuracion.balancer.pngMainDes : 
                    tipo_nodo === 'Controlador Main' ? this.configuracion.controller.pngMainDes : 
                    tipo_nodo === 'Balanceador Subs' ? this.configuracion.balancer.pngSubsDes : 
                    tipo_nodo === 'Controlador Subs' ? this.configuracion.controller.pngSubsDes : 
                    this.configuracion.processor.pngDes;
            }
            
            // Determinar la zona correspondiente al tipo de nodo
            const zona = tipo_nodo.startsWith('Balanceador') 
                ? this.zonas['Balanceador'] : tipo_nodo.startsWith('Controlador') 
                ? this.zonas['Controlador'] : this.zonas[tipo_nodo];

            const anchoZona = zona.xFin - zona.xInicio;
            const altoZona = this.alto - 2 * this.margenZona;

            // Índice local dentro de la zona
            const nodosZona = res.filter((n: any) => n.nodo.tipo_nodo.startsWith(tipo_nodo.split(" ")[0]));
            const indexZona = nodosZona.findIndex((n: any) => n.nodo.id === nodo.id);

             // Calcular la cantidad dinámica de columnas
            const nodosPorColumna = Math.floor(Math.sqrt(nodosZona.length)); // Basado en un layout cuadrado
            const espacioX = anchoZona / nodosPorColumna; // Espacio horizontal entre columnas
            const espacioY = altoZona / Math.ceil(nodosZona.length / nodosPorColumna); // Espacio vertical entre filas

            // Calcular posición del nodo
            const columna = indexZona % nodosPorColumna; // Columna actual
            const fila = Math.floor(indexZona / nodosPorColumna); // Fila actual

            const x = zona.xInicio + columna * espacioX + this.margenZona;
            const y = this.margenZona + fila * espacioY;

            // Retornar nodo con posición calculada
            return { 
                id: nodo.id,
                name: nodo.nombre, 
                symbolSize: size, 
                image: image,
                tipo_nodo,
                url: nodo.url,
                puerto: nodo.puerto,
                x,
                y,
                visible: nodo.visible
            };
        });
        const links = res.reduce((acc: any[], item2: any) => {
            const { nodo, status, datos } = item2;
                    
            // Enlaces de Balanceadores a Procesadores
            if(this.activarConexiones === true){
                if (nodo.tipo_nodo === 'Balanceador Main' && status === true) {
                    res.forEach((nodoTarget: any) => {
                        for(let i = 0; i < datos.Data.balancerList.length; i++){
                            if (datos.Data.balancerList[i].url === `${nodoTarget.nodo.url}:${nodoTarget.nodo.puerto}` && nodoTarget.status === true) {
                                acc.push({
                                    source: nodo.id,
                                    target: nodoTarget.nodo.id
                                });
                            }
                        }
                    });
                }
                else if(nodo.tipo_nodo === 'Balanceador Subs' && status === true && datos.Data.balancerSubsActive === true){
                    res.forEach((nodoTarget: any) => {
                        for(let i = 0; i < datos.Data.balancerList.length; i++){
                            if (datos.Data.balancerList[i].url === `${nodoTarget.nodo.url}:${nodoTarget.nodo.puerto}` && nodoTarget.status === true) {
                                acc.push({
                                    source: nodo.id,
                                    target: nodoTarget.nodo.id
                                });
                            }
                        }
                    });
                }
                
                // Enlace de Balanceadores "subs" hacia "main"
                if (nodo.tipo_nodo === 'Balanceador Subs' && status === true) {
                    const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlMain && n.status === true);
                    if (nodoTarget) {
                        acc.push({
                            source: nodo.id,
                            target: nodoTarget.nodo.id
                        });
                    }
                }

                // Enlace de Controladores "subs" hacia "main"
                if (nodo.tipo_nodo === 'Controlador Subs' && status === true) {
                    const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlCoordinatorlMain && n.status === true);
                    if (nodoTarget) {
                        acc.push({
                            source: nodo.id,
                            target: nodoTarget.nodo.id
                        });
                    }
                }

                //Controlador --> Balanceador
                if(nodo.tipo_nodo === 'Controlador Main' && status === true){
                    const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerMain && n.status === true);
                    if(nodoTarget){
                        acc.push({
                            source: String(nodo.id),
                            target: String(nodoTarget.nodo.id)
                        });
                    }
                    else{
                        const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerSubs && n.status === true);
                        if(nodoTarget){
                            acc.push({
                                source: String(nodo.id),
                                target: String(nodoTarget.nodo.id)
                            });
                        }
                    }
                }
                else if(nodo.tipo_nodo === 'Controlador Subs' && status === true){
                    const nodoMain = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlCoordinatorlMain && n.status === false && datos.Data.coordinatorSubsActive === true);
                    if(nodoMain){
                        const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerMain && n.status === true);
                        if(nodoTarget){
                            acc.push({
                                source: String(nodo.id),
                                target: String(nodoTarget.nodo.id)
                            });
                        }
                        else{
                            const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerSubs && n.status === true);
                            if(nodoTarget){
                                acc.push({
                                    source: String(nodo.id),
                                    target: String(nodoTarget.nodo.id)
                                });
                            }
                        }
                    }
                }
            }
            return acc;
        }, [])
        this.myChart.setOption({
            series: [
                {
                    data: data.filter((node: any) => node.visible !== false).map((node: any) => ({
                        id: node.id,
                        name: node.name,
                        x: node.x,  // Asegúrate de definir las coordenadas x y y de los nodos
                        y: node.y,
                        symbol: `image://assets/map/png/${node.image}`,
                        symbolSize: node.symbolSize,
                        visible: node.visible,
                        tipo_nodo: node.tipo_nodo,
                        url: node.url,
                        puerto: node.puerto
                    })),
                    links: links.map((link: any) => ({
                        source: String(link.source),
                        target: String(link.target),
                    })),
                }
            ]
        });
        this.datosDelSistema = res;
    }
    
    initChart(): void {
        this.http.getNodosOrdenados().subscribe((res) => {
            const requests = res.nodos.map((nodo: any) => 
                this.http.readDebug(`${nodo.url}:${nodo.puerto}`).pipe(
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
                const chartDom = document.getElementById('grafo');
                this.myChart = echarts.init(chartDom!);
    
                // Procesa los nodos para `data`
                const data = res.map((item: any) => {
                    const { nodo, status } = item;
                    const { nombre, tipo_nodo } = nodo;

                    let image = tipo_nodo === 'Balanceador Main' ? this.configuracion.balancer.pngMain : 
                        tipo_nodo === 'Controlador Main' ? this.configuracion.controller.pngMain : 
                        tipo_nodo === 'Balanceador Subs' ? this.configuracion.balancer.pngSubs : 
                        tipo_nodo === 'Controlador Subs' ? this.configuracion.controller.pngSubs : 
                        this.configuracion.processor.png;
                    const size = tipo_nodo === 'Balanceador' ? this.configuracion.balancer.size : tipo_nodo === 'Controlador' ? this.configuracion.controller.size : this.configuracion.processor.size;
                    if (!status) {
                        image = tipo_nodo === 'Balanceador Main' ? this.configuracion.balancer.pngMainDes : 
                            tipo_nodo === 'Controlador Main' ? this.configuracion.controller.pngMainDes : 
                            tipo_nodo === 'Balanceador Subs' ? this.configuracion.balancer.pngSubsDes : 
                            tipo_nodo === 'Controlador Subs' ? this.configuracion.controller.pngSubsDes : 
                            this.configuracion.processor.pngDes;
                    }
                    
                    // Determinar la zona correspondiente al tipo de nodo
                    const zona = tipo_nodo.startsWith('Balanceador') 
                        ? this.zonas['Balanceador'] : tipo_nodo.startsWith('Controlador') 
                        ? this.zonas['Controlador'] : this.zonas[tipo_nodo];

                    const anchoZona = zona.xFin - zona.xInicio;
                    const altoZona = this.alto - 2 * this.margenZona;

                    // Índice local dentro de la zona
                    const nodosZona = res.filter((n: any) => n.nodo.tipo_nodo.startsWith(tipo_nodo.split(" ")[0]));
                    const indexZona = nodosZona.findIndex((n: any) => n.nodo.id === nodo.id);

                     // Calcular la cantidad dinámica de columnas
                    const nodosPorColumna = Math.floor(Math.sqrt(nodosZona.length)); // Basado en un layout cuadrado
                    const espacioX = anchoZona / nodosPorColumna; // Espacio horizontal entre columnas
                    const espacioY = altoZona / Math.ceil(nodosZona.length / nodosPorColumna); // Espacio vertical entre filas

                    // Calcular posición del nodo
                    const columna = indexZona % nodosPorColumna; // Columna actual
                    const fila = Math.floor(indexZona / nodosPorColumna); // Fila actual

                    const x = zona.xInicio + columna * espacioX + this.margenZona;
                    const y = this.margenZona + fila * espacioY;

                    return { 
                        id: nodo.id,
                        name: nodo.nombre, 
                        symbolSize: size, 
                        image: image,
                        tipo_nodo: tipo_nodo,
                        url: nodo.url,
                        puerto: nodo.puerto,
                        x,
                        y,
                        visible: nodo.visible
                    };
                });
    
                // Construye enlaces `links`
                const links = res.reduce((acc: any[], item2: any) => {
                    const { nodo, status, datos } = item2;
                    
                        // Enlaces de Balanceadores a Procesadores
                        if(this.activarConexiones === true){
                            if (nodo.tipo_nodo === 'Balanceador Main' && status === true) {
                                res.forEach((nodoTarget: any) => {
                                    for(let i = 0; i < datos.Data.balancerList.length; i++){
                                        if (datos.Data.balancerList[i].url === `${nodoTarget.nodo.url}:${nodoTarget.nodo.puerto}` && nodoTarget.status === true) {
                                            acc.push({
                                                source: nodo.id,
                                                target: nodoTarget.nodo.id
                                            });
                                        }
                                    }
                                });
                            }
                            else if(nodo.tipo_nodo === 'Balanceador Subs' && status === true && datos.Data.balancerSubsActive === true){
                                res.forEach((nodoTarget: any) => {
                                    for(let i = 0; i < datos.Data.balancerList.length; i++){
                                        if (datos.Data.balancerList[i].url === `${nodoTarget.nodo.url}:${nodoTarget.nodo.puerto}` && nodoTarget.status === true) {
                                            acc.push({
                                                source: nodo.id,
                                                target: nodoTarget.nodo.id
                                            });
                                        }
                                    }
                                });
                            }
                
                            // Enlace de Balanceadores "subs" hacia "main"
                            if (nodo.tipo_nodo === 'Balanceador Subs' && status === true) {
                                const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlMain && n.status === true);
                                if (nodoTarget) {
                                    acc.push({
                                        source: nodo.id,
                                        target: nodoTarget.nodo.id
                                    });
                                }
                            }

                            // Enlace de Controladores "subs" hacia "main"
                            if (nodo.tipo_nodo === 'Controlador Subs' && status === true) {
                                const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlCoordinatorlMain && n.status === true);
                                if (nodoTarget) {
                                    acc.push({
                                        source: nodo.id,
                                        target: nodoTarget.nodo.id
                                    });
                                }
                            }

                            //Controlador --> Balanceador
                            if(nodo.tipo_nodo === 'Controlador Main' && status === true){
                                const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerMain && n.status === true);
                                if(nodoTarget){
                                    acc.push({
                                        source: String(nodo.id),
                                        target: String(nodoTarget.nodo.id)
                                    });
                                }
                                else{
                                    const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerSubs && n.status === true);
                                    if(nodoTarget){
                                        acc.push({
                                            source: String(nodo.id),
                                            target: String(nodoTarget.nodo.id)
                                        });
                                    }
                                }
                            }
                            else if(nodo.tipo_nodo === 'Controlador Subs' && status === true){
                                const nodoMain = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlCoordinatorlMain && n.status === false && datos.Data.coordinatorSubsActive === true);
                                if(nodoMain){
                                    const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerMain && n.status === true);
                                    if(nodoTarget){
                                        acc.push({
                                            source: String(nodo.id),
                                            target: String(nodoTarget.nodo.id)
                                        });
                                    }
                                    else{
                                        const nodoTarget = res.find((n: any) => `${n.nodo.url}:${n.nodo.puerto}` === datos.Data.internalConfig.urlBalancerSubs && n.status === true);
                                        if(nodoTarget){
                                            acc.push({
                                                source: String(nodo.id),
                                                target: String(nodoTarget.nodo.id)
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        return acc;
                }, []);
    
                const option = {
                    tooltip: {},
                    series: [
                        {
                            type: 'graph',
                            layout: 'none',
                            roam: true,
                            scaleLimit: {
                                min: 0.5,
                                max: 2
                            },
                            label: {
                                show: true,
                                position: 'bottom',
                            },
                            data: data.filter((node: any) => node.visible !== false).map((node: any) => ({
                                id: node.id,
                                name: node.name,
                                x: node.x,
                                y: node.y,
                                symbol: `image://assets/map/png/${node.image}`,
                                symbolSize: node.symbolSize,
                                visible: node.visible,
                                tipo_nodo: node.tipo_nodo,
                                url: node.url,
                                puerto: node.puerto
                            })),
                            links: links.map((link: any) => ({
                                source: String(link.source),
                                target: String(link.target),
                            })),
                            lineStyle: {
                                color: '#aaa',
                                width: 2,
                                opacity: 0.9,
                                curveness: 0.1
                            },
                            edgeSymbol: ['none', 'arrow'],
                            edgeSymbolSize: [4, 10],
                        }
                    ]
                };
                
                
                // Establece las opciones del gráfico
                this.myChart.setOption(option);
    
                // Manejar clic en los nodos
                this.myChart.on('click', (params: any) => {
                    if (params.dataType === 'node') {
                        console.log(params)
                        const nodoId = (params.data as any).id;
                        const tipoNodo = (params.data as any).tipo_nodo;
                        const url = (params.data as any).url;
                        const puerto = (params.data as any).puerto;
    
                        this.dialogo(tipoNodo, nodoId, url, puerto);
                    }
                });
                this.datosDelSistema = res;
                this.comprobar();
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