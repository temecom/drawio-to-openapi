/**
 * Stereotypes for UML definitions
 */
export enum UmlStereotype {
    CLASS = "class",
    INTERFACE = "interface",
    IMPLEMENTS = "implements",
    EXTENDS = "extends",
    ENUMERATION = "enumeration",
    PACKAGE = "package",
    ATTRIBUTE = "attribute", 
    METHOD = "method"
}

export enum UmlElement {
    NAME = 0,
    ATTRIBUTES,
    METHODS
}
/**
 * Superclass for all definitions
 */
export class BaseDefinition {
    name: string = "";
    id: string = "";
    stereotype: UmlStereotype = null as unknown as UmlStereotype;
    parent: string = "";
}

/**
 * The a meta class to describe a class
 */
 export class InterfaceDefinition extends BaseDefinition{
    methods:Array<MethodDefinition> = new Array();
    superClass: ClassDefinition = undefined as unknown as ClassDefinition;
    constructor() {
        super(); 
        this.stereotype = UmlStereotype.INTERFACE; 
    }
}
/**
 * The a meta class to describe a class
 */
export class ClassDefinition extends InterfaceDefinition{
    attributes:Array<AttributeDefinition> = new Array();
    superClass: ClassDefinition = undefined as unknown as ClassDefinition;
    constructor() {
        super(); 
        this.stereotype = UmlStereotype.CLASS; 
    }
}

export class PackageDefinition extends BaseDefinition {
    constructor() {
        super(); 
        this.stereotype = UmlStereotype.PACKAGE; 
    }
}

/**
 * The a meta class to describe a field
 */
export class AttributeDefinition extends BaseDefinition{
    type: string = "";
    constructor () {
        super(); 
        this.stereotype = UmlStereotype.ATTRIBUTE;  
    }
}

/**
 * The a meta class to describe a method
 */
 export class MethodDefinition extends BaseDefinition{
    type: string = "";
}

/**
 * The a meta class to describe a connector eg: 
 * generalization 
 * implements
 * has
 * hasMany
 */
export class AssociationDefinition extends BaseDefinition{
    source: BaseDefinition = undefined as unknown as BaseDefinition; 
    destination: BaseDefinition = undefined as unknown as BaseDefinition; 
}

/**
 * The a meta class to describe a generalization connector eg: 

 */
 export class GeneralizationDefinition extends AssociationDefinition{
    constructor() {
        super(); 
        this.stereotype = UmlStereotype.EXTENDS; 
    }
 }
/**
 * The a meta class to describe an implementation connector eg: 
 */
 export class ImplemenationDefinition extends AssociationDefinition{
    constructor() {
        super(); 
        this.stereotype = UmlStereotype.IMPLEMENTS; 
    }
 }

 /**
  * 
  */
 export class UmlGliffyItem {
    id: string = ""; 
    uid: string = "";
    stereotype: UmlStereotype = null as unknown as UmlStereotype; 
    texts: Array<string>  = new Array<string>();
    children: Map<UmlElement, Array<UmlGliffyItem>> = new Map<UmlElement, Array<UmlGliffyItem>>(); 
    source: any;
 }