import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  urlAPI = 'http://localhost:3000/api';
  
  headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor( private http:HttpClient) { }

  // Leer del endpoint de debug
  readDebug (url:string): Observable<object> {
    return this.http.post(url+'/sfmp',{UID:0, Type:'REQUEST', Operation:'DEBUG', Data:{} })
  }
  
  getNodos(): Observable<any>{
     return this.http.get(this.urlAPI + '/nodos', { headers: this.headers });
  }

  getNodo(id: any): Observable<any>{
    return this.http.get(this.urlAPI + '/nodo/' + id, { headers: this.headers });
  }

  async postNodo(datosNodo: any): Promise<any>{
    try {
      const response = await lastValueFrom(this.http.post(this.urlAPI + '/nodo', datosNodo, { headers: this.headers }));
      return response;
    } catch (error) {
      console.error('Error al enviar los datos del nodo', error);
      throw error;
    }
  }
}
