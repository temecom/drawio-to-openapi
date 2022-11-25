export class BaseDefinition {
    name: string;
    id: number; 
    stereotype: string;
    parent: number;
    constructor(id:number, name:string, parent:number, stereotype:string) {
        this.name = name; 
        this.id = id;
        this.stereotype = stereotype;
        this.parent = parent;  
    } 
}
/**
 * The a meta class to describe a class
 */
export class ClassDefinition extends BaseDefinition{
    fields:Array<FieldDefinition> = new Array(); 
}

/**
 * The a meta class to describe a field
 */
export class FieldDefinition extends BaseDefinition{
    type: string;
    constructor(id:number, name:string, parent:number, type:string) {
        super(id,name,parent,'field');
        this.type = type;  
    } 
}

/**
 * The a meta class to describe a method
 */
 export class MethodDefinition extends BaseDefinition{
    type: string;
    constructor(id:number, name:string, parent:number, type:string) {
        super(id,name,parent,'method');
        this.type = type; 
    } 
}