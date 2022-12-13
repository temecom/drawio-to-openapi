// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import * as classes from './umlClasses';

/**
 * Constants
 */

const GLIFFY_UID_PATTERN: RegExp = /com.gliffy.shape.uml.uml_v2.class.(\w*)/i;
const classPattern: RegExp = /<mxCell\s?id="(\d*)"\s?value=".*(class|interface|enum)&amp;gt;&amp;gt;&lt;br&gt;&lt;b&gt;(\w*).*parent="(\d*)"/i;
const fieldPattern: RegExp = /<mxCell\s?id="(\d*)"\s?value="(\w*):\s?(\w*).*parent="(\d*)"/i;
const GLIFFY_STEREOTYPE_PATTERN: RegExp = /"><<(\w*)>></g;
const GLIFFY_CLASS_NAME_PATTERN: RegExp = /">(\w*)</g;
const GLIFFY_ATTRIBUTES_PATTERN: RegExp = />(\w*:\s?\w*)</g;
const GLIFFY_ATTRIBUTE_PATTERN: RegExp = /(\w*):\s?(\w*)/i;
const GLIFFY_METHODS_PATTERN: RegExp = />(\w*\(\):\s?\w*)</g;
const GLIFFY_METHOD_PATTERN: RegExp = /(\w*\(\)):\s?(\w*)/i;
const GLIFFY_TEXT_GROUP_PATTERN: RegExp = />(\w*|w*:\s?\w*)</g;
const UID_GENERALIZATION: string = 'com.gliffy.shape.uml.uml_v2.class.generalization';
const UID_CLASS: string = 'com.gliffy.shape.uml.uml_v2.class.class';
const UID_INTERFACE: string = 'com.gliffy.shape.uml.uml_v2.class.interface';

/**
 * A class to convert a Gliffy UML Document to a neutral UMLDefinition set
 */
export class UmlConverter {

    constructor() {
        // Nothing to do
    }

    /**
     * Convert the open document to normalized UML form
     */
    convert(): void {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            var definitions: Array<classes.BaseDefinition> = this.convertGliffy(document);
            console.log("Converted: ");
            console.log(definitions);
        }
        vscode.window.showInformationMessage('File Converted Successfully!');
    }

    convertGliffy(document: vscode.TextDocument): Array<classes.BaseDefinition> {
        var definitions: Array<classes.BaseDefinition> = new Array();
        var definition: classes.BaseDefinition;
        var jsonDocument = JSON.parse(document.getText());
        Object.entries(jsonDocument).map(entry => {
            console.log(entry);
            if (entry[0] === "stage") {
                // Get the UML objects
                var stage: any = entry[1];
                var umlItems: Array<any> = stage['objects'] as Array<any>;
                console.log("Found:")
                umlItems.map(item => {
                    var umlGliffyItem: classes.UmlGliffyItem = this.parseGliffyItem(item);
                    switch (umlGliffyItem.stereotype) {
                        case classes.UmlStereotype.IMPLEMENTS:
                            break;
                        case classes.UmlStereotype.CLASS:
                            definition = this.createClass(umlGliffyItem);
                            definitions.push(definition);
                            console.log(definition);
                            break;
                        case classes.UmlStereotype.INTERFACE:
                            definition = this.createInterface(umlGliffyItem);
                            definitions.push(definition);
                            console.log(definition);
                            break;
                        default:
                            // Just log
                            console.log(item);
                    }
                });
            }
        });
        return definitions;
    }
    /**
     * Do the preliminary parsing of an element in the gliffy document
     * @param item the json object to parse
     * @returns a partially instanciated 
     */
    parseGliffyItem(item: any): classes.UmlGliffyItem {
        var umlGliffyItem: classes.UmlGliffyItem = new classes.UmlGliffyItem;
        umlGliffyItem.id = item["id"];
        umlGliffyItem.stereotype = this.locateStereotype(item);
        umlGliffyItem.source = item;
        return umlGliffyItem;
    }

    /**
     * Create a ClassDefinition from a gliffy item
     * @param item the gliffy item
     * @returns the modified ClassDefinition
     */
    createClass(umlGliffyItem: classes.UmlGliffyItem): classes.ClassDefinition {
        var classDefinition = new classes.ClassDefinition();
        var source: any = umlGliffyItem.source;
        var children: Array<any> = source["children"];
        classDefinition.id = umlGliffyItem.id;
        classDefinition.stereotype = this.locateStereotype(source);
        classDefinition.name = this.findName(source);
        classDefinition.attributes = this.findAttributes(children[classes.UmlElement.ATTRIBUTES]);
        classDefinition.methods = this.findMethods(children[classes.UmlElement.METHODS]);
        return classDefinition;
    }

    /**
    * Create a InterfaceDefinition from a gliffy item
    * @param item the Gliffy Iten
    * @returns the modified InterfaceDefinition
    */
    createInterface(umlGliffyItem: classes.UmlGliffyItem): classes.InterfaceDefinition {
        var interfaceDefinition = new classes.InterfaceDefinition();
        var source: any = umlGliffyItem.source;
        var children: Array<any> = source["children"];
        interfaceDefinition.id = umlGliffyItem.id;
        interfaceDefinition.stereotype = this.locateStereotype(source);
        interfaceDefinition.name = this.findName(source);
        interfaceDefinition.stereotype = this.locateStereotype(umlGliffyItem.source);
        interfaceDefinition.methods = this.findMethods(children[classes.UmlElement.METHODS]);
        return interfaceDefinition;
    }

    /**
     * Locate the sterotype - last segement of the uid eg: 
     * class
     * interface
     * @param item the Gliffy Item
     * @returns the stereotype the stereotype found or null
     */
    locateStereotype(item: any): classes.UmlStereotype {
        var stereotype: classes.UmlStereotype = null as unknown as classes.UmlStereotype;
        var uid: string = item['uid'] as string;
        if (uid) {
            var match: RegExpMatchArray | null = uid.match(GLIFFY_UID_PATTERN);
            if (match) {
                var stereotypeString: string = match[1];
                stereotype = stereotypeString as classes.UmlStereotype;
            }
        }
        return stereotype;
    }
    /**
     * Find the methods for an item (class or interface)
     * @param item the Gliffy Item
     * @returns an array of methods found - or empty array
     */
    findMethods(item: any): Array<classes.MethodDefinition> {
        var methods: Array<classes.MethodDefinition> = new Array();
        var methodTexts: Array<string> = this.findTexts(item, GLIFFY_METHODS_PATTERN);
        methodTexts.forEach(t => {
            var method: classes.MethodDefinition = new classes.MethodDefinition;
            var matches: RegExpMatchArray | null = t.match(GLIFFY_METHOD_PATTERN);
            if (matches) {
                method.id = randomUUID();
                method.name = matches[1];
                method.type = matches[2];
                method.stereotype = classes.UmlStereotype.METHOD; 
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
    findAttributes(item: any): Array<classes.AttributeDefinition> {
        var attributes: Array<classes.AttributeDefinition> = new Array();
        // Get the attributes
        var attributeTexts: Array<string> = this.findTexts(item, GLIFFY_ATTRIBUTES_PATTERN);
        attributeTexts.forEach(t => {
            var attribute: classes.AttributeDefinition = new classes.AttributeDefinition();
            attribute.id = randomUUID();
            var matches: RegExpMatchArray | null = t.match(GLIFFY_ATTRIBUTE_PATTERN);
            if (matches) {
                attribute.name = matches[1];
                attribute.type = matches[2];
                attribute.stereotype = classes.UmlStereotype.ATTRIBUTE; 
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
        var name: string = '';
        return this.findText(item["children"][classes.UmlElement.NAME], GLIFFY_CLASS_NAME_PATTERN);
    }
    /**
     * Find the first text in a possible array returned from findTexts()
     * @param item the Gliffy itme to use
     * @param pattern the pattern to use
     * @param childElement the child element to use @see: classes.UmlElement
     * @returns the first text or blank if not found
     */
    findText(item: any, pattern: RegExp): string {
        var text: string = '';
        var texts: Array<string> = this.findTexts(item, pattern);
        if (texts && texts.length > 1) {
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
    findTexts(item: any, pattern: RegExp): Array<string> {
        var texts: Array<string> = new Array();
        var text = "";
        var children: Array<any> = item["children"];
        children.forEach(child => {
            if (child["children"]) {
                // Go deeper
                texts = this.findTexts(child, pattern);
            } else {
                var graphic = child["graphic"];
                if (graphic) {
                    if (graphic["type"] === "Text") {
                        // Found the text = may be mutliple lines
                        var html: string = graphic["Text"]["html"];
                        var matches: Iterable<RegExpMatchArray> | null = html.matchAll(pattern);
                        if (matches) {
                            for (let match of matches) {
                                text = match[1];
                                texts.push(text);
                            };
                        }
                    }
                }
            }
        });
        return texts;
    }

}