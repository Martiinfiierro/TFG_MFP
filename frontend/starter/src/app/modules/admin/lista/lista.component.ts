import { Component, ViewEncapsulation, inject, EventEmitter, Output, Inject } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';

// Define la interfaz para los elementos de la tabla
export interface NodeData {
  id: number,
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
      MatButtonModule,
      CommonModule
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

  actualizarEstadoNodo(tipo:any, nombre:any, status: any){
    for(let i = 0; i < this.listaNodos.length; i++){
      if(this.listaNodos[i].nombre == nombre && this.listaNodos[i].tipo_nodo == tipo){
        this.listaNodos[i].status = status;
        console.log(this.listaNodos[i]);
      }
    }
  }

  actualizarDataSource(nodos: NodeData[]){
    this.listaNodos = [];
    for(let nodo of nodos){
      this.listaNodos.push(nodo);
    }
    this.dataSource.data = this.listaNodos;
  }

  iniProccesors() {
    const iniPort = 4001;
    this.config.processor.splice(0, this.config.processor.length);
    for (let i = 0; i < this.numProcessors; i++) {
      const newO = { baseurl: this.localhost, port: Number(iniPort + i), url: this.localhost + ":" + Number(iniPort + i) }
      this.config.processor.push(newO);
    }
  }

  updateProcessors(i:any) {
    //console.log('Inicio updateProcessors:',i);
    this.http.readDebug(this.config.processor[i].url).subscribe({
        next: (val: any) => {
          console.log('Process:',val)
          this.componentsStatus.processors[i] = true;
          this.processorsState[i] = val;
          // Volvemos a programar la lectura
          timer(this.readTime).subscribe(() => this.updateProcessors(i));

        },
        error: (err) => {
          this.componentsStatus.processors[i] = false;
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
        this.actualizarEstadoNodo('Balanceador', 'Main', true);
        this.mainBalancerState = val;
        timer(this.readTime).subscribe(() => this.updateMainBalancerState());

      },
      error: (err) => {
        this.actualizarEstadoNodo('Balanceador', 'Main', false);
        // console.log('updateMainBalancerState no devuelve state')
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
        this.componentsStatus.subsBalancer = true;
        this.subsBalancerState = val;
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsBalancerState());

      },
      error: (err) => {
        this.componentsStatus.subsBalancer = false;
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
        //console.log(val)
        this.componentsStatus.mainCoordinator = true;
        this.mainCoordinatorState = val;
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateMainCoordinatorState());

      },
      error: (err) => {
        this.componentsStatus.mainCoordinator = false;
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
        this.componentsStatus.subsCoordinator = true;
        this.subsCoordinatorState = val;
        console.log(this.componentsStatus.subsCoordinator)
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsCoordinatorState());

      },
      error: (err) => {
        this.componentsStatus.subsCoordinator = false;
        console.log(this.componentsStatus.subsCoordinator)
        // console.log('updateSubsCoordinatorState no devuelve state')
        // Volvemos a programar la lectura
        timer(this.readTime).subscribe(() => this.updateSubsCoordinatorState());
      }
    }
    );
  }

  //Botones

    irAGrafo(): void {
        this.router.navigate(['/grafo']); // Navega a la ruta 'grafo'
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

  constructor(private http: ApiService, @Inject(MAT_DIALOG_DATA) private data: any) {
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

  cerrarDialog(): void {
    this.dialogRef.close();
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

  selectedOption: string;
  puerto: string;
  url: string;
  nombre: string;
  geolocalizacion: string;

  readonly dialogRef = inject(MatDialogRef<AnadirNodo>);

  constructor(private http: ApiService){}

  anadirNodo(){
    const nodoData = {
      tipo_nodo: this.selectedOption,
      nombre: this.nombre,
      puerto: this.puerto,
      url: this.url,
      geolocalizacion: this.geolocalizacion
    }
    this.http.postNodo(nodoData).subscribe();
    this.cerrarDialog();
  }

  cerrarDialog(): void {
    this.dialogClosed.emit();
    this.dialogRef.close();
  }
}