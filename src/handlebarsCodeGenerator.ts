import * as uml from "./umlEntities";
import * as handlebars from "handlebars";
/**
 * Generate java code from the job definition
 * Uses handlebars templates and templating engine to process the
 */
export class HandlebarsCodeGenerator implements uml.Exporter {
  /**
   * Generate the java class definitions from the UmlDefinition
   * @param model uml.ModelDefinition to use
   */
  export(command: uml.ExportStep): string {
    let code: string = "";
    console.debug("Generating Java code for:");
    console.debug(command);
    if (command.definition != null && command.template != null) {
      const definition = command.definition as any;
      console.debug("generating java code from: %s", definition.name);
      // Create a json object that has the indexable parameters
      const date: Date = new Date();
      const context: any = {
        definition,
        date: date.toISOString(),
      };

      // Use handlebars to compile
      const compiledTemplate = handlebars.compile(command.template);

      // Generate with the context
      code = compiledTemplate(context);
    }
    return code;
  }
}
