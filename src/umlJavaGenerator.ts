import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import * as uml from './umlEntities';

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
            var modelJson: any = {
                definition: definition as any,
                date: Date.now()
            };
            code = command.template;
            var matches: RegExpMatchArray = code.match(/\$\{(\w|[.()])*\}/g)!;
            if (matches) {
                matches.forEach(key => {
                    console.log(key);
                    var value = this.findValue(modelJson, key.substring(2, key.length - 1));
                    if (value) {
                        console.log("==>" +  value); 
                        code = code.replace(key, value);
                    }
                });
            } else {
                console.error("No model passed for generation");
            }
        }
        return code;
    }

    findValue(modelJson: any, match: string): string | null {
        var value: string = null as unknown as string;
        var keys = match.split(".");
        var json = modelJson;
        keys.forEach((key, index) => {
            if (json && json[key]) {
                if (index < keys.length-1) {
                    json = json[key];
                } else {
                    value = json[key];
                }
            }
        });
        return value.toString(); 
    }
}