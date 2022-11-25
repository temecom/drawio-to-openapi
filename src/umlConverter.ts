// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as classes from './umlClasses';

/**
* The states for the UML converter
*/
enum ConverterState {
    IDLE,
    CLASS,
    FIELD,
    METHOD
}

enum GroupIndex {
    ID = 1,
    NAME = 2,
    PARENT = 4,
    TYPE = 3

}
export class UmlConverter {

    classPattern: RegExp = /<mxCell\s?id="(\d*)"\s?value=".*(class|interface|enum)&amp;gt;&amp;gt;&lt;br&gt;&lt;b&gt;(\w*).*parent="(\d*)"/i;
    fieldPattern: RegExp = /<mxCell\s?id="(\d*)"\s?value="(\w*):\s?(\w*).*parent="(\d*)"/i;

    // Current state of the converter
    state: ConverterState = ConverterState.IDLE;
    classDefinitions:Array<classes.ClassDefinition> = new Array();

    constructor() {
        // Nothing to do
    }

 
    /**
     * Convert the open document to normalized UML form
     */
    convert(): void {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        var classDefinition: classes.ClassDefinition;
        if (editor) {
            const document = editor.document;

            var lineCount = document.lineCount;
            for (var lineNumber: number = 0; lineNumber < lineCount; lineNumber++) {
                var line = document.lineAt(lineNumber);

                switch (this.state) {
                    case ConverterState.IDLE:
                        //Look for class
                        var matches = line.text.match(this.classPattern);
                        if (matches) {
                            // Found one
                            classDefinition = new classes.ClassDefinition(Number.parseInt(matches[GroupIndex.ID]), 
                                matches[GroupIndex.NAME], 
                                Number.parseInt(matches[GroupIndex.PARENT]), 
                                matches[GroupIndex.TYPE]);
                            this.classDefinitions.push(classDefinition);
                            this.state = ConverterState.CLASS;
                        }
                        break;
                    case ConverterState.CLASS:
                        // Look for field
                        var matches = line.text.match(this.fieldPattern);
                        if (matches) {
                            // Found one
                            var fieldDefinition:classes.FieldDefinition; 
                            let parent:number = Number.parseInt(matches[4]); 
                            if (classDefinition!.id === parent) {
                                fieldDefinition = new classes.FieldDefinition(Number.parseInt(matches[GroupIndex.PARENT]),
                                     matches[GroupIndex.NAME],
                                     parent,
                                     matches[GroupIndex.TYPE]);
                                classDefinition!.fields.push(fieldDefinition); 
                            } else {
                                this.state = ConverterState.IDLE;
                            }
                        }
                        break;
                    case ConverterState.FIELD:
                        // Look for methods

                        break;
                       
                }
            }
        }
        vscode.window.showInformationMessage('File Converted Successfully!');
    }
}