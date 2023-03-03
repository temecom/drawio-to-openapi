// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { randomUUID } from "crypto";
import * as uml from "./umlEntities";

/**
 * Constants
 */

const GLIFFY_UID_PATTERN: RegExp = /com.gliffy.shape.uml.uml_v2.class.(\w*)/i;
const GLIFFY_CLASS_NAME_PATTERN: RegExp = /">([a-zA-Z0-9.]*)</g;
const GLIFFY_ATTRIBUTES_PATTERN: RegExp = />(\w*:\s?\w*)</g;
const GLIFFY_ATTRIBUTE_PATTERN: RegExp = /(\w*):\s?(\w*)/i;
const GLIFFY_METHODS_PATTERN: RegExp =
  />([a-zA-Z0-9]*[(].*[)]:\s?[a-zA-Z0-9<>]*)</g;
const GLIFFY_METHOD_PATTERN: RegExp =
  /([a-zA-Z0-9]*)[(](.*)[)]:\s?([a-zA-Z0-9<>]*)/i;
const GLIFFY_PARAMETER_PATTERN: RegExp = /([a-zA-Z0-9]*):([a-zA-Z0-9<>]*)/g;

// /(\w*)[(](?=(([a-zA-Z0-9]*):([a-zA-Z0-9<>]*)))[ ,]?[)]:(\s?\w*)/g
/**
 *
 */
export class UmlGliffyItem {
  id: string = "";
  uid: string = "";
  stereotype: uml.UmlStereotype = null as unknown as uml.UmlStereotype;
  texts: string[] = new Array<string>();
  children: Map<uml.UmlElement, UmlGliffyItem[]> = new Map<
    uml.UmlElement,
    UmlGliffyItem[]
  >();
  source: any;
}

/**
 * A class to convert a Gliffy UML Document in '.gliffy' json form to a neutral UMLDefinition set
 */
export class Importer implements uml.Importer {
  /**
   * Scan the Gliffy doucment for the uml model definitions
   * @param document Gliffy document in '.gliffy' json form
   * @returns converted model
   */
  import(document: string, name: string): uml.ModelDefinition {
    const model: uml.ModelDefinition = new uml.ModelDefinition();
    model.name = name;
    const jsonDocument = JSON.parse(document);
    Object.entries(jsonDocument).forEach((entry) => {
      console.debug(entry);
      if (entry[0] === "stage") {
        // Get the UML objects
        const stage: any = entry[1];
        const umlItems: any[] = stage.objects as any[];
        console.debug("Found:");
        umlItems.forEach((item) => {
          let classDefinition: uml.ClassDefinition;
          let interfaceDefinition: uml.InterfaceDefinition;
          let packageDefinition: uml.PackageDefinition;
          const umlGliffyItem: UmlGliffyItem = this.parseGliffyItem(item);
          switch (umlGliffyItem.stereotype) {
            case uml.UmlStereotype.IMPLEMENTS:
              break;
            case uml.UmlStereotype.CLASS:
              classDefinition = this.createClass(umlGliffyItem);
              model.addClass(classDefinition);
              console.debug(classDefinition);
              break;
            case uml.UmlStereotype.INTERFACE:
              interfaceDefinition = this.createInterface(umlGliffyItem);
              model.addInterface(interfaceDefinition);
              console.debug(interfaceDefinition);
              break;
            case uml.UmlStereotype.PACKAGE:
              packageDefinition = this.createPackage(umlGliffyItem);
              model.addPackage(packageDefinition);
              console.debug(packageDefinition);
              break;
            default:
              // Just log
              console.debug(item);
          }
        });
      }
    });
    if (model.packages.length === 1) {
      // Only one package use as default
      model.defaultPackage = model.packages[0];
    }
    return model;
  }

  /**
   * Do the preliminary parsing of an element in the gliffy document
   * @param item the json object to parse
   * @returns a partially instanciated
   */
  parseGliffyItem(item: any): UmlGliffyItem {
    const umlGliffyItem: UmlGliffyItem = new UmlGliffyItem();
    umlGliffyItem.id = item.id;
    umlGliffyItem.stereotype = this.locateStereotype(item);
    umlGliffyItem.source = item;
    return umlGliffyItem;
  }

  /**
   * Create a ClassDefinition from a gliffy item
   * @param item the gliffy item
   * @returns the modified ClassDefinition
   */
  createClass(umlGliffyItem: UmlGliffyItem): uml.ClassDefinition {
    const classDefinition = new uml.ClassDefinition();
    const source: any = umlGliffyItem.source;
    const children: any[] = source.children;
    classDefinition.id = umlGliffyItem.id;
    classDefinition.name = this.findName(source);
    classDefinition.attributes = this.findAttributes(
      children[uml.UmlElement.ATTRIBUTES]
    );
    classDefinition.methods = this.findMethods(
      children[uml.UmlElement.METHODS]
    );
    return classDefinition;
  }

  /**
   * Create a InterfaceDefinition from a gliffy item
   * @param item the Gliffy Iten
   * @returns the modified InterfaceDefinition
   */
  createInterface(umlGliffyItem: UmlGliffyItem): uml.InterfaceDefinition {
    const interfaceDefinition = new uml.InterfaceDefinition();
    const source: any = umlGliffyItem.source;
    const children: any[] = source.children;
    interfaceDefinition.id = umlGliffyItem.id;
    interfaceDefinition.name = this.findName(source);
    interfaceDefinition.methods = this.findMethods(
      children[uml.UmlElement.METHODS]
    );
    return interfaceDefinition;
  }

  /**
   * Create a package from the Gliffy item
   * @param umlGliffyItem the Gliffy Item
   * @returns packageDefinition
   */
  createPackage(umlGliffyItem: UmlGliffyItem): uml.PackageDefinition {
    const packageDefinition: uml.PackageDefinition =
      new uml.PackageDefinition();
    const source: any = umlGliffyItem.source;
    packageDefinition.id = umlGliffyItem.id;
    packageDefinition.name = this.findName(source);
    return packageDefinition;
  }

  /**
   * Locate the sterotype - last segement of the uid eg:
   * class
   * interface
   * @param item the Gliffy Item
   * @returns the stereotype the stereotype found or null
   */
  locateStereotype(item: any): uml.UmlStereotype {
    let stereotype: uml.UmlStereotype = null as unknown as uml.UmlStereotype;
    const uid: string = item.uid as string;
    if (uid != null) {
      const match: RegExpMatchArray | null = uid.match(GLIFFY_UID_PATTERN);
      if (match != null) {
        const stereotypeString: string = match[1];
        stereotype = stereotypeString as uml.UmlStereotype;
      }
    }
    return stereotype;
  }

  /**
   * Find the methods for an item (class or interface)
   * @param item the Gliffy Item
   * @returns an array of methods found - or empty array
   */
  findMethods(item: any): uml.MethodDefinition[] {
    const methods: uml.MethodDefinition[] = [];
    // Locate all of the methods under the class child
    const methodTexts: string[] = this.findTexts(item, GLIFFY_METHODS_PATTERN);
    methodTexts.forEach((t) => {
      const method: uml.MethodDefinition = new uml.MethodDefinition();
      // Get the outer method details - name():type
      const matches: RegExpMatchArray | null = t.match(GLIFFY_METHOD_PATTERN);
      if (matches != null) {
        method.id = randomUUID();
        method.name = matches[1];
        const parameters: string = matches[2];
        const parameterMatches: IterableIterator<RegExpMatchArray> | null =
          parameters.matchAll(GLIFFY_PARAMETER_PATTERN);
        if (parameterMatches != null) {
          for (const parameterMatch of parameterMatches) {
            const parameterName = parameterMatch[1];
            const parameterType = parameterMatch[2];
            method.addParameter(parameterName, parameterType);
          }
        }
        method.type = matches[3];
        method.stereotype = uml.UmlStereotype.METHOD;
        methods.push(method);
      }
    });
    return methods;
  }

  /**
   * Find the attributes for an item (class or interface)
   * @param item the Gliffy Item
   * @returns an array of attributes or emtpy array
   */
  findAttributes(item: any): uml.AttributeDefinition[] {
    const attributes: uml.AttributeDefinition[] = [];
    // Get the attributes
    const attributeTexts: string[] = this.findTexts(
      item,
      GLIFFY_ATTRIBUTES_PATTERN
    );
    attributeTexts.forEach((t) => {
      const attribute: uml.AttributeDefinition = new uml.AttributeDefinition();
      attribute.id = randomUUID();
      const matches: RegExpMatchArray | null = t.match(
        GLIFFY_ATTRIBUTE_PATTERN
      );
      if (matches != null) {
        attribute.name = matches[1];
        attribute.type = matches[2];
        attribute.stereotype = uml.UmlStereotype.ATTRIBUTE;
      }
      attributes.push(attribute);
    });
    return attributes;
  }

  /**
   * Convenience method to find the name in a Gliffy element
   * @param item the Gliffy element
   *
   * @returns the name string or blank if not found
   */
  findName(item: any): string {
    return this.findText(
      item.children[uml.UmlElement.NAME],
      GLIFFY_CLASS_NAME_PATTERN
    );
  }

  /**
   * Find the first text in a possible array returned from findTexts()
   * @param item the Gliffy itme to use
   * @param pattern the pattern to use
   * @param childElement the child element to use @see: classes.UmlElement
   * @returns the first text or blank if not found
   */
  findText(item: any, pattern: RegExp): string {
    let text: string = "";
    const texts: string[] = this.findTexts(item, pattern);
    if (texts.length > 0) {
      text = texts[texts.length - 1];
    }
    return text;
  }

  /**
   * Locate the texts in a Gliffy item
   *
   * @param item the Gliffy item to use
   * @returns an array of texts located or an empty array
   */
  findTexts(item: any, pattern: RegExp): string[] {
    let texts: string[] = [];
    let text = "";
    const children: any[] = item.children;
    children.forEach((child) => {
      if (child.children != null) {
        // Go deeper
        texts = this.findTexts(child, pattern);
      } else {
        const graphic = child.graphic;
        if (graphic != null) {
          if (graphic.type === "Text") {
            // Found the text = may be mutliple lines
            const html: string = graphic.Text.html;
            const matches: Iterable<RegExpMatchArray> | null =
              html.matchAll(pattern);
            if (matches != null) {
              for (const match of matches) {
                for (let i = 1; i < match.length; i++) {
                  text = match[i];
                  if (text.length > 0) {
                    texts.push(text);
                  }
                }
              }
            }
          }
        }
      }
    });
    return texts;
  }
}
