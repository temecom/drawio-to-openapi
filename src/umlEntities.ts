/*
 * @file: umlEntities.ts
 */
import { randomUUID } from "crypto";
import { Uri } from "vscode";

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
  MODEL = "model",
}

export enum UmlElement {
  NAME = 0,
  ATTRIBUTES,
  METHODS,
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
  OPTIONAL_BLOCK_END = "END_OPTIONAL_BLOCK",
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
    this.id = id ?? randomUUID();
    this.name = name ?? "";
  }
}
/**
 * Superclass for all definitions
 */
export class BaseDefinition extends BaseEntity {
  stereotype: UmlStereotype = null as unknown as UmlStereotype;
  parent: string = "";
}

/**
 * Superclass for all component definitions
 * - Class
 *  - Interface
 *  - Enumeration
 *  - Service
 */
export class ComponentDefinition extends BaseEntity {
  stereotype: UmlStereotype = null as unknown as UmlStereotype;
  parent: string = "";
  package?: PackageDefinition;
}

/**
 * Meta class to describe a Model
 */
export class ModelDefinition extends BaseDefinition {
  classes: ClassDefinition[];
  interfaces: InterfaceDefinition[];
  packages: PackageDefinition[];
  defaultPackage?: PackageDefinition;
  constructor() {
    super();
    this.stereotype = UmlStereotype.MODEL;
    this.classes = [];
    this.interfaces = [];
    this.packages = [];
  }

  addClass(classDefinition: ClassDefinition): void {
    this.classes.push(classDefinition);
  }

  addInterface(interfaceDefinition: InterfaceDefinition): void {
    this.interfaces.push(interfaceDefinition);
  }

  addPackage(packageDefinition: PackageDefinition): void {
    this.packages?.push(packageDefinition);
  }
}
/**
 * Interface for all UmlConvertors
 */
export interface Importer {
  import: (document: string, name: string) => ModelDefinition;
}

/**
 * Interface for a UML generator
 */
export interface Exporter {
  export: (command: ExportStep) => string;
}
/**
 * Superclass for UML jobs and steps
 */
export class BaseProcess extends BaseEntity {
  name: string;
  description?: string;
  constructor(name: string) {
    super();
    this.name = name;
  }
}
/**
 * Job to import and convert a UML model
 */
export class ImportStep extends BaseProcess {
  /** Importer to use */
  importerClassname: string;
  importer?: Importer;
  sourceUri?: Uri;
  destinationUri?: Uri;
  document?: string;

  /** Converted Model */
  model?: ModelDefinition;

  constructor() {
    super("NewImportStep");
    // Default importer
    this.importerClassname = "gliffy.Importer";
  }
}

/**
 * Job to generate code
 */
export class ExportStep extends BaseProcess {
  /** UML Definition */
  definition?: ComponentDefinition;

  /** Code generator to use */
  exporter?: Exporter;

  /** File name for a code template file in 'handlebars' format */
  templateName?: string;

  /** Code template file in 'handlebars' format */
  template?: string;

  /** Default package */
  package?: PackageDefinition;

  /** Generated code */
  code?: string;
  fileExtension: string = "";
  path: string = "";
  destinationUri?: Uri;
  constructor() {
    super("NewExportStep");
  }
}
/**
 * Complete Uml Job - conversion through generation
 */
export class UmlJob extends BaseProcess {
  parameters?: Map<string, any>;
  importSteps: ImportStep[];
  model?: ModelDefinition;
  exportSteps: ExportStep[];
  constructor() {
    super("NewUmlJob");
    this.importSteps = [];
    this.exportSteps = [];
  }
}
/**
 * The meta class to describe a class
 */
export class InterfaceDefinition extends ComponentDefinition {
  methods: MethodDefinition[] = [];
  superClass?: InterfaceDefinition;
  constructor() {
    super();
    this.stereotype = UmlStereotype.INTERFACE;
  }
}
/**
 * The a meta class to describe a class
 */
export class ClassDefinition extends InterfaceDefinition {
  attributes: AttributeDefinition[] = [];
  superClass?: ClassDefinition;
  implementations?: ImplemenationDefinition[];
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
export class EnumerationDefinition extends ComponentDefinition {
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
  parameters: AttributeDefinition[];
  constructor() {
    super();
    this.parameters = new Array<AttributeDefinition>();
  }

  /**
   * Add a parameter to the parameter array
   * @param parameter
   */
  addParameter(name: string, type: string): void {
    const parameter: AttributeDefinition = new AttributeDefinition();
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
