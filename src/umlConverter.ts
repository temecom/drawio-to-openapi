// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import * as uml from './umlEntities';
import * as gliffy from './umlGliffyConverter';
import * as java from './umlCodeGenerator';
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
            try {
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
                        console.debug("Saved file to " + fileUri.path);
                        vscode.workspace.openTextDocument(fileUri).then(document => {
                            vscode.window.showTextDocument(document);
                        });
                    });
                });
                console.debug("Converted: ");
                console.debug(model);

            } catch (e) {
                console.error("Failed to import code", e);
            }
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
            try {
                const document = editor.document;
                var model: uml.ModelDefinition = JSON.parse(document.getText()) as uml.ModelDefinition;

                model.classes.forEach(definition => {
                    // Create the job wrapper class
                    var job: uml.GeneratorJob = new uml.GeneratorJob();

                    job.definition = definition;
                    job.templateName = "classTemplate";
                    job.fileExtension = "java";
                    job.path = "src/main/java";
                    job.package = model.defaultPackage;
                    this.generateCodeFromJob(context, job)
                        .then(result =>
                            console.debug(result)
                        );
                });

            } catch (e) {
                console.error("Failed to generate Java code %s", e);
                vscode.window.showErrorMessage("Failed to generate Java code");
            }
        } else {
            console.error("No editor open");
            vscode.window.showWarningMessage("Please open a valid UML json file");
        }

        vscode.window.showInformationMessage('Files generated Successfully!').then(v => {
            console.debug("Completed Code Generation");
        });
    }

    generateCodeFromJob(context: vscode.ExtensionContext, job: uml.GeneratorJob): Thenable<string> {

        if (!(job && job.definition && job.templateName && job.fileExtension && job.path)) {
            throw new Error("Missing job.definition || job.templateName ");
        }
        var definition: uml.BaseDefinition = job.definition;
        if (!definition.package) {
            // Assign a default package if there is none defined 
            definition.package = job.package;
        }
        var generator: uml.Generator = new java.UmlJavaGenerator();
        return this.readTemplate(context, job.templateName + "." + job.fileExtension)
            .then(template => {

                // Generate the code using the job
                job.template = template; 
                return generator.generate(job);
            }).then(code => {

                // split the package 
                var packagePaths: Array<string>  = definition.package!.name.split("."); 
                // Create the file uri 
                var baseUmlUri: vscode.Uri = vscode.Uri.from({ scheme: "file", path: context.asAbsolutePath("generated") });
                var fileUri = vscode.Uri.joinPath(baseUmlUri, job.path!); 

                // Concatenate the segments of the package
                fileUri = packagePaths.reduce ((f,s) => vscode.Uri.joinPath(f,s), fileUri); 
                fileUri = vscode.Uri.joinPath(fileUri, definition.name + "." + job.fileExtension!);

                // Write the file - returning a promise
                return this.writeFile(context, fileUri, code);
            }).then(editor => {
                // Report success
                return "Success";
            });

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

    writeFile(context: vscode.ExtensionContext, fileUri: vscode.Uri, content: string): Thenable<vscode.TextEditor> {

        return vscode.workspace.fs.writeFile(fileUri, Buffer.from(content))
            .then(f => {
                return vscode.workspace.fs.stat(fileUri)
            })
            .then(fileStat => {
                console.debug("Saved file to " + fileUri.path);
                return vscode.workspace.openTextDocument(fileUri)
            })
            .then(document => {
                return vscode.window.showTextDocument(document);
            });
    }

}