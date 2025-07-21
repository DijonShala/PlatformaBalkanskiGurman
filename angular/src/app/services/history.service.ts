import { Injectable } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class HistoryService {
  private urls: string[] = [];

  constructor(private router: Router) {
    this.router.events.subscribe((routerEvent) => {
      if (routerEvent instanceof NavigationEnd)
        this.urls.push(routerEvent.urlAfterRedirects);
    });
  }

  public getPreviousUrl(): string {
    this.urls.pop();
    if (this.urls.length > 0) return this.urls.slice(-1).toString();
    else return "/";
  }

  public getLastNonLoginUrl(): string {
    const exclude: string[] = ["/register", "/login"];
    this.urls.pop();
    const filtererd = this.urls.filter((url) => !exclude.includes(url));
    if (filtererd.length > 0) return filtererd.slice(-1).toString();
    else return "/";
  }
}