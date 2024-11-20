import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Config {
  controller: {
    colorA: string;
    colorD: string;
    nameMain: string;
    nameSubs: string;
    shape: string;
    png: string;
    size: number;
  };
  balancer: {
    colorA: string;
    colorD: string;
    nameMain: string;
    nameSubs: string;
    shape: string;
    png: string;
    size: number;
  };
  processor: {
    colorA: string;
    colorD: string;
    shape: string;
    png: string;
    size: number;
  };
  espera: {
    valor: number;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {

  private configUrl = 'assets/theme/config.json';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<Config> {
    return this.http.get<Config>(this.configUrl);
  }
}
