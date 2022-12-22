/*
* @file: umlEntities.ts
*/
import { randomUUID } from "crypto";

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
    METHOD = "method",
    MODEL = "model"
}

export enum UmlElement {
    NAME = 0,
    ATTRIBUTES,
    METHODS
}

/**
 * Modifiers used to change the template parsing behavior
 * These are prefixed with '@' in the template keys
 */

export enum TemplateModifier {
    OPTIONAL = "optional",
    ITERATATION_BLOCK = "iterate",
    ITERATE_BLOCK = "iterateBlock",
    ITERATION_BLOCK_END = "endBlock",
    OPTIONAL_BLOCK = "OPTIONAL_BLOCK",
    OPTIONAL_BLOCK_END = "END_OPTIONAL_BLOCK"
}
/**
 * Base class for all UML entities 
 * 
 */
export class BaseEntity {
    name: string;
    id: string;
    /**
     * Default contstructor
     * @param id (optional) id of the entity - a random UUID is assigned if not passed
     * @param name (optional) name of the entity
     */
    constructor(id?: string, name?: string) {
        this.id = id ? id : randomUUID();
        this.name = name ? name : "";
    }

}
/**
 * Superclass for all definitions
 */
export class BaseDefinition extends BaseEntity {
    stereotype: UmlStereotype = null as unknown as UmlStereotype;
    parent: string = "";
    package?: PackageDefinition;
    constructor() {
        super();
    }
}

/**
 * Meta class to describe a Model 
 */
export class ModelDefinition extends BaseDefinition {
    classes: Array<ClassDefinition>;
    interfaces: Array<InterfaceDefinition>;
    packages: Array<PackageDefinition>;
    defaultPackage?: PackageDefinition;
    constructor() {
        super();
        this.stereotype = UmlStereotype.MODEL;
        this.classes = new Array();
        this.interfaces = new Array();
        this.packages = new Array();
    }

    addClass(classDefinition: ClassDefinition) {
        this.classes.push(classDefinition);
    }

    addInterface(interfaceDefinition: InterfaceDefinition) {
        this.interfaces.push(interfaceDefinition);
    }

    addPackage(packageDefinition: PackageDefinition) {
        this.packages?.push(packageDefinition);
    }
}
/**
 * Interface for all UmlConvertors
 */
export interface Converter {
    convert(document: string, name: string): ModelDefinition;
}

/**
 * Interface for a UML generator 
 */
export interface Generator {

    generate(command: GeneratorJob): string;

}
/**
 * Superclass for UML jobs
 */
export class BaseJob extends BaseEntity {

}
/**
 * Job to import and convert a UML model 
 */
export class ConversionJob extends BaseJob {

    /** Converter to use */
    converter?: Converter;

    /** Converted Model */
    model?: ModelDefinition;

    constructor() {
        super();
    }
}
/**
 * Job to generate code
 */
export class GeneratorJob extends BaseJob {

    /** UML Definition */
    definition?: BaseDefinition;

    /** Code generator to use */
    generator?: Generator;

    /** File name for a code template file in 'handlebars' format */
    templateName?: string;

    /** Code template file in 'handlebars' format */
    template?: string;

    /** Default package */
    package?: PackageDefinition;

    /** Generated code */
    code?: string;
    fileExtension?: string;
    path?: string;

    constructor() {
        super();
    }
}
/**
 * The meta class to describe a class
 */
export class InterfaceDefinition extends BaseDefinition {
    methods: Array<MethodDefinition> = new Array();
    superClass?: ClassDefinition;
    constructor() {
        super();
        this.stereotype = UmlStereotype.INTERFACE;
    }
}
/**
 * The a meta class to describe a class
 */
export class ClassDefinition extends InterfaceDefinition {
    attributes: Array<AttributeDefinition> = new Array();
    superClass?: ClassDefinition;
    implementations?: Array<ImplemenationDefinition>;
    constructor() {
        super();
        this.stereotype = UmlStereotype.CLASS;
    }
}
/**
 * A package definition
 */
export class PackageDefinition extends BaseDefinition {
    constructor() {
        super();
        this.stereotype = UmlStereotype.PACKAGE;
    }
}


/**
 * A package definition
 */
export class EnumerationDefinition extends BaseDefinition {
    constructor() {
        super();
        this.stereotype = UmlStereotype.ENUMERATION;
    }
}

/**
 * The a definition class to describe an Attribute
 */
export class AttributeDefinition extends BaseDefinition {
    type: string = "";
    constructor() {
        super();
        this.stereotype = UmlStereotype.ATTRIBUTE;
    }
}

/**
 * The a meta class to describe a method
 */
export class MethodDefinition extends BaseDefinition {
    type: string = "";
    parameters: Array<AttributeDefinition>; 
    constructor() {
        super(); 
        this.parameters = new Array<AttributeDefinition>(); 
    }

    /**
     * Add a parameter to the parameter array
     * @param parameter 
     */
    addParameter(name: string, type: string) {
        var parameter: AttributeDefinition = new AttributeDefinition(); 
        parameter.name = name; 
        parameter.type = type;
        this.parameters.push(parameter); 
    }
}

/**
 * The a meta class to describe a connector eg: 
 * generalization 
 * implements
 * has
 * hasMany
 */
export class AssociationDefinition extends BaseDefinition {
    source: BaseDefinition = undefined as unknown as BaseDefinition;
    destination: BaseDefinition = undefined as unknown as BaseDefinition;
}

/**
 * The a meta class to describe a generalization connector eg: 

 */
export class GeneralizationDefinition extends AssociationDefinition {
    constructor() {
        super();
        this.stereotype = UmlStereotype.EXTENDS;
    }
}
/**
 * The a meta class to describe an implementation connector eg: 
 */
export class ImplemenationDefinition extends AssociationDefinition {
    constructor() {
        super();
        this.stereotype = UmlStereotype.IMPLEMENTS;
    }
}

