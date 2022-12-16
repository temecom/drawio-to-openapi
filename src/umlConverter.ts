// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import * as uml from './umlEntities';
import * as gliffy from './umlGliffyConverter';
import * as java from './umlJavaGenerator';
import * as path from 'path';
import { writeFile } from 'fs';

/**
 * A class to convert a Gliffy UML Document in '.gliffy' json form to a neutral UMLDefinition set
 */
export class UmlConverter {

    constructor() {
        // Nothing to do
    }

    /**
     * Convert the open document to normalized UML form
     */
    convert(context: vscode.ExtensionContext): void {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {

            //TODO:  Only one converter do far - add optional converter selection
            var converter: uml.Converter = new gliffy.UmlConverter();
            const document = editor.document;
            var fileNameSegments = document.fileName.split(".")[0].split("/");
            var name = fileNameSegments[fileNameSegments.length - 1];
            var model: uml.ModelDefinition = converter.convert(document.getText(), name);
            //TODO: use file selector
            var baseUmlUri: vscode.Uri = vscode.Uri.from({ scheme: "file", path: context.asAbsolutePath("generated/uml") });
            var fileUri = vscode.Uri.joinPath(baseUmlUri, name + ".json")
            vscode.workspace.fs.writeFile(fileUri, Buffer.from(JSON.stringify(model))).then(file => {

                vscode.workspace.fs.stat(fileUri).then(fileStat => {
                    console.log("Saved file to " + fileUri.path);
                    vscode.workspace.openTextDocument(fileUri).then(document => {
                        vscode.window.showTextDocument(document);
                    });
                });

            });
            console.log("Converted: ");
            console.log(model);
        }
        vscode.window.showInformationMessage('File Converted Successfully!');
    }

    /**
     * Generate working code from the UML Model for the open document
     * @param context 
     */
    generate(context: vscode.ExtensionContext): void {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            var model: uml.ModelDefinition = JSON.parse(document.getText()) as uml.ModelDefinition;
            var generator: uml.Generator = new java.UmlJavaGenerator();
            this.readTemplate(context, "classTemplate.java").then(template => {
                model.classes.every((classDefinition) => {
                    // Create the command wrapper class
                    var command: uml.Command = new uml.Command();
                    command.template = template;
                    if(!classDefinition.package) {
                        // Assign a default package if there is none defined 
                        classDefinition.package=model.defaultPackage; 
                    }
                    command.definition = classDefinition;
                    var code: string = generator.generate(command);
                    this.writeFile(context, classDefinition.name, "java",code);
                });
            });
        } else {
            console.error("No editor open");
        }
    }

    /**
     * Load a template based on the name
     * @param context the extension context - needed for the fileSystem 
     * @param name template name
     * @returns file text 
     */
    readTemplate(context: vscode.ExtensionContext, name: string): Thenable<string> {

        var rootPath: vscode.Uri = vscode.Uri.from({ scheme: "file", path: context.asAbsolutePath("./template") });
        var templateUri: vscode.Uri = vscode.Uri.joinPath(rootPath, name);
        var template: string = "";
        return vscode.workspace.fs.readFile(templateUri).then(array => {
            return array.toString();
        });
    }

    writeFile(context: vscode.ExtensionContext, name: string,  extension: string, content:string): void {
        var baseUmlUri: vscode.Uri = vscode.Uri.from({ scheme: "file", path: context.asAbsolutePath("generated") });
        var fileUri = vscode.Uri.joinPath(baseUmlUri, extension, name + "." + extension); 
        vscode.workspace.fs.writeFile(fileUri, Buffer.from(content)).then(f => {
            vscode.workspace.fs.stat(fileUri).then(fileStat => {
                console.log("Saved file to " + fileUri.path);
                vscode.workspace.openTextDocument(fileUri).then(document => {
                    vscode.window.showTextDocument(document);
                });
            });
        }); 
    }

}