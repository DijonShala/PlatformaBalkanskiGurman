import { Injectable } from "@angular/core";
import { fromEvent, merge, Observable, Observer } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class ConnectionService {
  public isConnected: boolean = false;

  constructor() {
    merge(
      fromEvent(window, "offline").pipe(map(() => false)),
      fromEvent(window, "online").pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      })
    ).subscribe((connected: boolean) => (this.isConnected = connected));
  }
}