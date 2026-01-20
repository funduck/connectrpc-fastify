import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { Guard, Middleware, Service, Type } from './interfaces';
declare class ControllersStoreClass {
    private controllers;
    values(): {
        instance: any;
        service: GenService<any>;
        target: Type<any>;
    }[];
    registerInstance<T extends GenServiceMethods>(self: Service<GenService<T>>, service: GenService<T>, { allowMultipleInstances, }?: {
        allowMultipleInstances?: boolean;
    }): void;
}
export declare const ControllersStore: ControllersStoreClass;
declare class MiddlewareStoreClass {
    private middlewares;
    registerInstance(self: Middleware, { allowMultipleInstances, }?: {
        allowMultipleInstances?: boolean;
    }): void;
    getInstance(middlewareClass: Type<Middleware>): Middleware | null;
}
export declare const MiddlewareStore: MiddlewareStoreClass;
declare class RouteMetadataStoreClass {
    private routes;
    registerRoute(serviceName: string, methodName: string, controllerClass: Type<any>, controllerMethod: Function, controllerMethodName: string, instance: any): void;
    getRouteMetadata(urlPath: string): {
        controllerClass: Type<any>;
        controllerMethod: Function;
        controllerMethodName: string;
        instance: any;
        serviceName: string;
        methodName: string;
    } | null;
    getAllRoutes(): [string, {
        controllerClass: Type<any>;
        controllerMethod: Function;
        controllerMethodName: string;
        instance: any;
        serviceName: string;
        methodName: string;
    }][];
}
export declare const RouteMetadataStore: RouteMetadataStoreClass;
declare class GuardsStoreClass {
    private guards;
    registerInstance(self: Guard, { allowMultipleInstances, }?: {
        allowMultipleInstances?: boolean;
    }): void;
    getInstance(guardClass: Type<Guard>): Guard | null;
    getAllGuards(): Guard[];
}
export declare const GuardsStore: GuardsStoreClass;
export {};
