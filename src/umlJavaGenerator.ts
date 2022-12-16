import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import * as uml from './umlEntities';
import * as handlebars from 'handlebars'; 

const LINE_SPLIT_PATTERN = /\n/;
const PARAMETER_PATTERN = /\$\{([a-zA-Z0-9.,()@]*)\}/g;
const NEW_LINE_CHARACTER = '\n';
export class UmlJavaGenerator implements uml.Generator { 

    constructor() {
        // Do nothing 
    }

    /**
     * Generate the java class definitions from the UmlDefinition
     * @param model uml.ModelDefinition to use
     */
    generate(command: uml.Command): string {
        var code: string = ""; 
        console.log(command); 
        if (command.definition && command.template) {
            var definition = command.definition as any;
            console.log("generating java code from: %s", definition.name);
            // Create a json object that has the indexable parameters
            var date: Date = new Date(); 
            var modelJson: any = {
                definition: definition as any,
                date: date.toISOString()
            };
            var codeLines = command.template.split(LINE_SPLIT_PATTERN);
            codeLines.forEach(line => {
                var matches = line.match(PARAMETER_PATTERN);
                var newLine: string = line; 
                if (matches) {
                    matches.forEach(match => {
                        console.log(match);
                        var optional:boolean = false; 
                        var modifierMatches = match.match(/@(\w*)(\(([a-z.]*)\))?/i);
                        if (modifierMatches) {
                            var modifier = modifierMatches[0]; 
                            switch(modifier) {
                                case uml.TemplateModifier.OPTIONAL:
                                    //  Handle the optional modifier
                                    optional = true; 
                                    //TODO: handle a parameter
                                break; 
                                case uml.TemplateModifier.OPTIONAL_BLOCK:
                                    // Handle a block of optional code
                                    break; 
                                case uml.TemplateModifier.OPTIONAL_BLOCK_END: 
                                    // Terminate the optional block handling
                                    break;
                                case uml.TemplateModifier.ITERATATION_BLOCK:
                                    // Start the iteration over a block of code using the parameters to manage the loop
                                break; 

                                case uml.TemplateModifier.ITERATION_BLOCK_END:
                                    // Terminate an iteratoin block
                                break; 

                            }
                           
                        }
                        // Lookup the value from the model definition
                        // Strip the match to provide a raw key
                        var key = match.substring(2, match.length - 1);
                        var value = this.findValue(modelJson, key);
                        if (value) {
                            console.log("==>" + value);
                            newLine = line.replace(match, value.toString());                            
                        } else {
                            // Not found - erase if optional
                            if (optional) {
                                newLine = line.replace(match,''); 
                            }
                        }
                    });
                }
                code += newLine + NEW_LINE_CHARACTER;
            });
        }
        return code;
    }

    /**
     * Lookup the value using key. Keys can be '.' notated to index into a complex object. 
     * @param modelJson any object containing the values indexed by the '.' notated key
     *  eg: 
     *    { 
     *          model: { 
     *              name: "BaseEntity"
     *              ...
     *          }, 
     *          date: 2022-01-01T12:00Z-7
     *    }
     * @param key lookup key
     * @returns value or null
     */
    findValue(modelJson: any, key: string): string | null {
        var value: string = null as unknown as string;
        var keys = key.split(".");
        var json = modelJson;
        keys.forEach((k, i) => {
            if (json && json[k]) {
                if (i < keys.length-1) {
                    json = json[k];
                } else {
                    value = json[k];
                }
            }
        });
        return value; 
    }
}