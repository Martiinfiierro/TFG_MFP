import { Component, ViewEncapsulation, inject, OnInit } from '@angular/core';
import { ApiService } from 'app/services/api.service';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableDataSource } from '@angular/material/table';
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
  tipo_nodo: string;
  nombre: string;
  url: string;
  puerto: string;
  geolocalizacion: string;
  status: boolean;
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
      MatButtonModule
    ]
})
export class ListaComponent
{
  readTime = 3000;
  idTimer: any;

  //Lista
  listaNodos: NodeData[] = [];
  displayedColumns: string[] = ['tipo_nodo', 'url', 'puerto', 'nombre', 'geolocalizacion', 'actions'];
  dataSource = new MatTableDataSource<NodeData>(this.listaNodos);

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

  localhost = 'http://localhost'
  config = {
    balancerMain: { baseurl: this.localhost, port: 3100, url: this.localhost + ":3100" },
    balancerSubs: { baseurl: this.localhost, port: 3101, url: this.localhost + ":3101" },
    coordinatorMain: { baseurl: this.localhost, port: 3000, url: this.localhost + ":3000" },
    coordinatorSubs: { baseurl: this.localhost, port: 3001, url: this.localhost + ":3001" },
    processor: [{ baseurl: '', port: 0, url: '' }]
  }

  //Dialogo
  readonly dialog = inject(MatDialog);


  constructor(private http: ApiService, private router: Router) { }

  ngOnInit(): void {
    // Inicilizamos los datos de los procesadores, puerto y url para consulta
    this.iniProccesors();

    this.updateMainBalancerState();
    this.updateSubsBalancerState();
    this.updateMainCoordinatorState();
    this.updateSubsCoordinatorState();
   
    // Lanzamos un update para cada processor configurado
    //this.config.processor.forEach((element , index) => { this.updateProcessors(index); })
    this.getNodos();
  }

  getNodos(){
    this.http.getNodos()
      .subscribe((result) =>{
        this.actualizarDataSource(result.nodos);
    });
  }

  actualizarDataSource(nodos: NodeData[]){
    for(let nodo of nodos){
      this.listaNodos.push(nodo);
    }
    this.dataSource.data = this.listaNodos;
  }

  // Configuramos los datos de los procesadores
  iniProccesors() {
    const iniPort = 4001;
    this.config.processor.splice(0, this.config.processor.length);
    for (let i = 0; i < this.numProcessors; i++) {
      const newO = { baseurl: this.localhost, port: Number(iniPort + i), url: this.localhost + ":" + Number(iniPort + i) }
      this.config.processor.push(newO);
    }
  }

  show(val: any) {
    return JSON.stringify(val)
  }

  updateProcessors(i:any) {
    //console.log('Inicio updateProcessors:',i);
    this.http.readDebug(this.config.processor[i].url).subscribe({
        next: (val: any) => {
          const node: NodeData = {
            tipo_nodo: 'Procesador',
            url: val.Data.internalConfig.urlCoordinatorMain, // Cambia esto según tu estructura
            puerto: val.Data.internalConfig.port.toString(),
            nombre: `Procesador ${i + 1}`,
            geolocalizacion: 'N/A',
            status: true, // Cambia esto si tienes información de geolocalización
          };
          this.http.postNodo(node).subscribe(
            (respuesta) => {
              console.log('Datos recibidos del servidor:', respuesta);
              // Aquí puedes manejar la respuesta como desees
            },
            (error) => {
              console.error('Error al enviar los datos:', error);
            }
          );
          const listaProv: NodeData[] = [];
          listaProv.push(node);
          this.actualizarDataSource(listaProv);
          
          // Volvemos a programar la lectura
          timer(this.readTime).subscribe(() => this.updateProcessors(i));

        },
        error: (err) => {
          console.log('updateProcessors no devuelve state')
          // Volvemos a programar la lectura
          timer(this.readTime).subscribe(() => this.updateProcessors(i));
        }
      });
  
  }

  // Actualizar estado de mainBlanacer
  updateMainBalancerState() {
    // console.log('Inicio updateMainBalancerState');
    // Consultamos el balanceador principal
    this.http.readDebug(this.config.balancerMain.url).subscribe({
      next: (val: any) => {
        const node: NodeData = {
          tipo_nodo: 'Balanceador',
          nombre: 'Balanceador Principal',
          url: 'hola',
          puerto: val.Data.internalConfig.port.toString(),
          geolocalizacion: 'N/A',
          status: true,  // Cambia esto si tienes información de geolocalización
        };
        this.http.postNodo(node).subscribe(
          (respuesta) => {
            //Añadimos al datasource
            const listaProv: NodeData[] = [];
            listaProv.push(node);
            this.actualizarDataSource(listaProv);
          },
          (error) => {
            console.error('Error al enviar los datos:', error);
          }
        );

        timer(this.readTime).subscribe(() => this.updateMainBalancerState());

      },
      error: (err) => {
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateMainBalancerState());
      }
    });
  }

  // Actualizar estado de subsBalancer
  updateSubsBalancerState() {
    // console.log('Inicio updateSubsBalancerState');
    // Consultamos el balanceador principal
    this.http.readDebug(this.config.balancerSubs.url).subscribe({
      next: (val: any) => {
        const node: NodeData = {
          tipo_nodo: 'Balanceador',
          url: val.Data.internalConfig.urlMain,
          puerto: val.Data.internalConfig.port.toString(),
          nombre: 'Balanceador Sustituto',
          geolocalizacion: 'N/A',
          status: true,  // Cambia esto si tienes información de geolocalización
        };
        this.http.postNodo(node).subscribe(
          (respuesta) => {
            //Añadimos al datasource
            const listaProv: NodeData[] = [];
            listaProv.push(node);
            this.actualizarDataSource(listaProv);
          },
          (error) => {
            console.error('Error al enviar los datos:', error);
          }
        );
        
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsBalancerState());

      },
      error: (err) => {
        // console.log('updateSubsBalancerState no devuelve state')
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsBalancerState());
      }
    }
    );
  }

  // Actualizar estado de mainCoordinator
  updateMainCoordinatorState() {
    // console.log('Inicio updateMainCoordinatorState');
    // Consultamos el balanceador principal
    this.http.readDebug(this.config.coordinatorMain.url).subscribe({
      next: (val: any) => {
        const node: NodeData = {
          tipo_nodo: 'Controlador',
          url: 'prueba',
          puerto: val.Data.internalConfig.port.toString(),
          nombre: 'Controlador Principal',
          geolocalizacion: 'N/A',
          status: true,  // Cambia esto si tienes información de geolocalización
        };
        this.http.postNodo(node).subscribe(
          (respuesta) => {
            //Añadimos al datasource
            const listaProv: NodeData[] = [];
            listaProv.push(node);
            this.actualizarDataSource(listaProv);
          },
          (error) => {
            console.error('Error al enviar los datos:', error);
          }
        );

        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateMainCoordinatorState());

      },
      error: (err) => {
        // console.log('updateMainCoordinatorState no devuelve state')
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateMainCoordinatorState());
      }
    }
    );
  }

  // Actualizar estado subsCoordinator
  updateSubsCoordinatorState() {
    // console.log('Inicio updateSubsCoordinatorState');
    // Consultamos el balanceador principal
    this.http.readDebug(this.config.coordinatorSubs.url).subscribe({
      next: (val: any) => {
        this.subsCoordinatorState = val;
        const node: NodeData = {
          tipo_nodo: 'Controlador',
          url: 'prueba',
          puerto: val.Data.internalConfig.port.toString(),
          nombre: 'Controlador Sustituto',
          geolocalizacion: 'N/A',
          status: true,  // Cambia esto si tienes información de geolocalización
        };
        this.http.postNodo(node).subscribe(
          (respuesta) => {
            //Añadimos al datasource
            const listaProv: NodeData[] = [];
            listaProv.push(node);
            this.actualizarDataSource(listaProv);
          },
          (error) => {
            console.error('Error al enviar los datos:', error);
          }
        );

        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsCoordinatorState());

      },
      error: (err) => {
        //console.log('updateSubsCoordinatorState no devuelve state')
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsCoordinatorState());
      }
    }
    );
  }

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
  templateUrl: '../dialogs/dialogControlador.html',
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
  templateUrl: '../dialogs/dialogControlador.html',
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
  templateUrl: '../dialogs/dialogControlador.html',
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