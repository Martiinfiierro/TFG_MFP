import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  urlAPI = 'http://localhost:8080/api';
  
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

  postNodo(datosNodo: any): Observable<any>{
    return this.http.post(this.urlAPI + '/nodo', datosNodo, { headers: this.headers });
  }
}
