import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import * as uml from './umlEntities';
import * as handlebars from 'handlebars'; 
/**
 * Generate java code from the job definition
 * Uses handlebars templates and templating engine to process the 
 */
export class UmlJavaGenerator implements uml.Generator { 

    constructor() {
        // Do nothing 
    }

    /**
     * Generate the java class definitions from the UmlDefinition
     * @param model uml.ModelDefinition to use
     */
    generate(command: uml.GeneratorJob): string {
        var code: string = ""; 
        console.debug("Generating Java code for:"); 
        console.debug(command);
        if (command.definition && command.template) {
            var definition = command.definition as any;
            console.debug("generating java code from: %s", definition.name);
            // Create a json object that has the indexable parameters
            var date: Date = new Date(); 
            var context: any = {
                definition: definition as any,
                date: date.toISOString()
            };

            // Use handlebars to compile
            var compiledTemplate = handlebars.compile(command.template); 

            // Generate with the context
            code = compiledTemplate(context); 
        }
        return code;
    }
}