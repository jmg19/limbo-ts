import Limbo, { LimboMountableElement, Type } from "./Limbo";
import { LimboComponent } from "./LimboComponent";

export type LimboRoute = {
  path: string[];
  component: Type<LimboComponent<unknown>>;
};

export type LimboRoutingGroup = {
  routingName: string;
  routes: LimboRoute[];
};

export class LimboRouting implements LimboMountableElement {
  private currentPath: string;
  private currerntRoutingPath?: string;
  private currentRoutingRoute?: LimboRoute;
  private currentRoutingRouteParams?: { [key: string]: number | string | boolean };
  private mountedChilds: LimboMountableElement[] = [];
  private routingHistoryPopStateListener: EventListener;

  constructor(
    private routingName: string,
    private routingElement: HTMLElement,
    private routes: LimboRoute[],
  ) {
    this.routingHistoryPopStateListener = () => {
      this.navigate(window.location.pathname);
      Limbo.setComponentsModelsDataOnHistoryPopState(this.routingName);
    };
    this.currentPath = window.location.pathname;
  }

  getRoutingParams<T>(): T | undefined {
    if (!this.currentRoutingRouteParams) {
      return undefined;
    }

    return this.currentRoutingRouteParams as T;
  }

  private mountChilds(): void {
    if (!this.currentRoutingRoute) {
      return;
    }

    const routingComponentName = this.currentRoutingRoute.component.name;
    this.routingElement.innerHTML = "";
    const routedComponentElement = document.createElement("div");
    routedComponentElement.id = `${this.routingName}-${routingComponentName}`;
    routedComponentElement.setAttribute("data-limbo-component", routingComponentName);
    this.routingElement.appendChild(routedComponentElement);

    this.mountedChilds = Limbo.bootstrap(this.routingElement, { routingParams: this.currentRoutingRouteParams });
  }

  private unmountChilds(): void {
    while (this.mountedChilds.length > 0) {
      this.mountedChilds.pop()?.unmount();
    }
  }

  unmount(): void {
    this.unmountChilds();
    this.routingElement.remove();
    Limbo.removeRenderedRouting(this.routingName);
    window.removeEventListener("popstate", this.routingHistoryPopStateListener);
  }

  mount() {
    window.addEventListener("popstate", this.routingHistoryPopStateListener);
    this.navigate(this.currentPath, true);
  }

  navigate(path: string, mounting: boolean = false) {
    if (!path) {
      path = "/";
    }

    if (!mounting && this.currentPath === path) {
      return;
    }

    const pathRegex = new RegExp(`(\\/[^\\/]+)`, "g");
    const pathMatches = path.match(pathRegex);

    let currentRoutingPath;
    if (path === "/" || (pathMatches && pathMatches.length > 0)) {
      let currentRoute: LimboRoute | undefined;
      let count = 0;

      let routeParams: { [key: string]: number | string | boolean } | undefined;
      while (!currentRoute && count < this.routes.length) {
        const route = this.routes[count];

        let auxPath = "";
        for (let i = 0; i < route.path.length; i++) {
          const routePath = route.path[i];
          if (routePath.startsWith("/:") && pathMatches && pathMatches[i]) {
            if (!routeParams) {
              routeParams = {};
            }

            if (pathMatches[i] === "/true") {
              routeParams[routePath.substring(2)] = true;
            } else if (pathMatches[i] === "/false") {
              routeParams[routePath.substring(2)] = false;
            } else if (!isNaN(Number(pathMatches[i]))) {
              routeParams[routePath.substring(2)] = Number(pathMatches[i].substring(1));
            } else {
              routeParams[routePath.substring(2)] = pathMatches[i].substring(1);
            }

            auxPath = `${auxPath}/${routeParams[routePath.substring(2)]}`;
          } else {
            auxPath = `${auxPath}${routePath}`;
          }
        }

        if (path.startsWith(auxPath)) {
          currentRoute = route;
          currentRoutingPath = auxPath;
        }

        count++;
      }

      if (currentRoute) {
        if (!this.currentRoutingRoute || this.currerntRoutingPath !== currentRoutingPath) {
          if (this.mountedChilds.length > 0) {
            this.unmountChilds();
          }

          this.currentRoutingRoute = currentRoute;
          this.currentRoutingRouteParams = routeParams;

          this.mountChilds();
          this.currerntRoutingPath = currentRoutingPath;
        }
      } else {
        if (this.mountedChilds.length > 0) {
          this.unmountChilds();
        }
      }

      this.currentPath = path;
    } else {
      console.error(`Path ${path} is not valid`);
    }
  }
}
