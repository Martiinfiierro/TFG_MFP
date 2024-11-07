import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class GrafoService {
  urlAPI = 'http://localhost:8080/api';

  constructor( private http:HttpClient ) { }

  // Leer del endpoint de debug
  readDebug (url:string): Observable<object> {
    return this.http.post(url+'/sfmp',{UID:0, Type:'REQUEST', Operation:'DEBUG', Data:{} })
  }

  getNodos(): Observable<any>{
    return this.http.get(this.urlAPI + '/nodos');
  }

  getNodo(id: any): Observable<any>{
    return this.http.get(this.urlAPI + '/nodo/' + id);
  }

  async postNodo(datosNodo: any): Promise<any>{
    try {
      const response = await lastValueFrom(this.http.post(this.urlAPI + '/nodo', datosNodo));
      return response;
    } catch (error) {
      console.error('Error al enviar los datos del nodo', error);
      throw error;
    }
  }

  async putNodo(datosNodo: any): Promise<any> {
    try {
      const response = await lastValueFrom(this.http.put(this.urlAPI + '/nodo/' + datosNodo.id, datosNodo));
      return response;
    } catch (error) {
      console.error('Error al actualizar los datos del nodo', error);
      throw error;
    }
  }
}