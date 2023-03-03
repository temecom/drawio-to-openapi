import * as vscode from "vscode";
import * as uml from "./umlEntities";
import * as gliffy from "./umlGliffyConverter";
import * as handleBarsGenerator from "./handlebarsCodeGenerator";
import assert = require("assert");
import { UmlCommon } from "./umlCommon";

const PARAMETER_PATTERN: RegExp = /\$\{([.0-9A-Za-z]*)\}/g;

/**
 * A class to convert a Gliffy UML Document in '.gliffy' json form to a neutral UMLDefinition set
 */
export class UmlConverter {
  /**
   * Convert the open document to normalized UML form
   */
  import(context: vscode.ExtensionContext, importStep?: uml.ImportStep): void {
    // Get the active text editor
    if (importStep) {
      // Use step settings
      let source = importStep.sourceUri;
      if (source) {
        vscode.workspace.fs.readFile(source).then((sourceText) => {
          importStep!.document = sourceText.toString();
          return this.importModelFromStep(context, importStep!);
        });
      }
    } else {
      // Use open editor
      const editor = vscode.window.activeTextEditor;
      if (editor != null) {
        try {
          // TODO:  Only one converter so far - add optional converter selection
          const document = editor.document;
          const fileNameSegments = document.fileName.split(".")[0].split("/");
          const name = fileNameSegments[fileNameSegments.length - 1];
          // TODO: use file selector
          const baseUmlUri: vscode.Uri = vscode.Uri.from({
            scheme: "file",
            path: context.asAbsolutePath("generated/uml"),
          });
          const fileUri = vscode.Uri.joinPath(baseUmlUri, name + ".uml.json");
          importStep = new uml.ImportStep();
          importStep.document = document.getText();
          importStep.name = name;
          importStep.destinationUri = fileUri;
          this.importModelFromStep(context, importStep!)
            .then((importStep) => {
              return vscode.workspace.openTextDocument(fileUri);
            })
            .then((exportDocument) =>
              vscode.window.showTextDocument(exportDocument)
            );
        } catch (e) {
          console.error("Failed to import code %s", e);
        }
      }
    }
    void vscode.window.showInformationMessage("File Converted Successfully!");
  }

  /**
   * Convert the document to a uml model and save it to the output
   * @param context vscode context
   * @param document document to convert
   * @param name name of document
   * @returns Thenable<TextDocument> converted document within a promise
   */
  importModelFromStep(
    context: vscode.ExtensionContext,
    importStep: uml.ImportStep
  ): Thenable<uml.ImportStep> {
    const document = importStep.document;
    assert(document);

    const name: string = importStep.name;
    assert(name);

    const fileUri = importStep.destinationUri;
    assert(fileUri);

    // Default importer
    var importer: uml.Importer = new gliffy.Importer();
    switch (importStep.importerClassname) {
      case "gliffy.Importer":
        importer = new gliffy.Importer();
        break;
      case "drawio.Importer":
        //TODO:  Add drawio importer
        break;
    }

    const model: uml.ModelDefinition = importer.import(document, name);

    return vscode.workspace.fs
      .writeFile(fileUri, Buffer.from(JSON.stringify(model)))
      .then((file) => {
        return vscode.workspace.fs.stat(fileUri);
      })
      .then(() => {
        importStep.model = model;
        return importStep;
      });
  }

  /**
   * Generate working code from the UML Model for the open document
   * @param context
   */
  export(context: vscode.ExtensionContext): void {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (editor != null) {
      try {
        const document = editor.document;
        const model: uml.ModelDefinition = JSON.parse(
          document.getText()
        ) as uml.ModelDefinition;

        model.classes.forEach((definition) => {
          // Create the job wrapper class
          const job: uml.ExportStep = new uml.ExportStep();

          job.definition = definition;
          job.templateName = "classTemplate";
          job.fileExtension = "java";
          job.path = "src/main/java";
          job.package = model.defaultPackage;
          void this.exportFromJob(context, job).then((result) =>
            console.debug(result)
          );
        });
      } catch (e) {
        console.error("Failed to generate Java code %s", e);
        void vscode.window.showErrorMessage("Failed to generate code");
      }
    } else {
      console.error("No editor open");
      void vscode.window.showWarningMessage(
        "Please open a valid UML json file"
      );
    }

    void vscode.window
      .showInformationMessage("Files generated Successfully!")
      .then((v) => {
        console.debug("Completed Code Generation");
      });
  }

  /**
   * Use the current job document to import and generate
   * @param context editor context
   */
  runJob(context: vscode.ExtensionContext): void {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (editor != null) {
      try {
        // Get the current job document
        const document = editor.document;
        let jobText: string = document.getText();
        jobText = this.resolveParameters(jobText);
        const job: uml.UmlJob = JSON.parse(jobText) as uml.UmlJob;

        console.info("Executing job: %s", job.name);
        job.importSteps.forEach((step) => {
          console.info("Converting with job %s - %s", job.name, step.name);
          this.import(context, step);
        });
      } catch (e) {
        console.error("Failed to run job %s", e);
        void vscode.window.showErrorMessage("Failed to generate code");
      }
    } else {
      console.error("No editor open");
      void vscode.window.showWarningMessage("Please open a valid UML job file");
    }

    void vscode.window
      .showInformationMessage("Files generated Successfully!")
      .then((v) => {
        console.debug("Completed Code Generation");
      });
  }

  /**
   * Generate code from generator job
   * @param context
   * @param job
   * @returns
   */
  exportFromJob(
    context: vscode.ExtensionContext,
    job: uml.ExportStep
  ): Thenable<string> {
    if (
      !(
        job?.definition != null &&
        job.templateName != null &&
        job.fileExtension != null &&
        job.path != null
      )
    ) {
      throw new Error("Missing job.definition || job.templateName ");
    }
    // Correct missing package in component
    // TODO: move to import code
    const definition: uml.ComponentDefinition = job.definition;
    let codePackage: uml.PackageDefinition = new uml.PackageDefinition();
    codePackage.name = "";
    if (definition.package == null) {
      if (job.package != null) {
        // Assign a default package if there is none defined
        codePackage = job.package;
      }
    } else {
      codePackage = definition.package;
    }
    definition.package = codePackage;
    const generator: uml.Exporter =
      new handleBarsGenerator.HandlebarsCodeGenerator();
    return this.readTemplate(
      context,
      job.templateName + "." + job.fileExtension
    )
      .then((template) => {
        // Generate the code using the job
        job.template = template;
        return generator.export(job);
      })
      .then((code) => {
        // split the package
        const packagePaths: string[] = codePackage.name.split(".");
        // Create the file uri
        const baseUmlUri: vscode.Uri = vscode.Uri.from({
          scheme: "file",
          path: context.asAbsolutePath("generated"),
        });
        let fileUri = vscode.Uri.joinPath(baseUmlUri, job.path);

        // Concatenate the segments of the package
        fileUri = packagePaths.reduce(
          (f, s) => vscode.Uri.joinPath(f, s),
          fileUri
        );
        fileUri = vscode.Uri.joinPath(
          fileUri,
          definition.name + "." + job.fileExtension
        );

        // Write the file - returning a promise
        return this.writeFile(context, fileUri, code);
      })
      .then((editor) => {
        // Report success
        return "Success";
      });
  }

  /**
   *
   * @param jobText the jobText to resolve parameters in
   * @returns an updated job
   */
  resolveParameters(jobText: string): string {
    let configuration = vscode.workspace.getConfiguration();
    var resolvedText: string = jobText;
    var matches: Iterable<RegExpMatchArray> | null =
      jobText.matchAll(PARAMETER_PATTERN);
    if (matches) {
      for (const matchGroups of matches) {
        let key = matchGroups[1];
        let value: string = configuration.get(key) || "not-found";
        resolvedText = resolvedText.replace(matchGroups[0], value);
      }
    }
    return resolvedText;
  }
  /**
   * Load a template based on the name
   * @param context the extension context - needed for the fileSystem
   * @param name template name
   * @returns file text
   */
  readTemplate(
    context: vscode.ExtensionContext,
    name: string
  ): Thenable<string> {
    const rootPath: vscode.Uri = vscode.Uri.from({
      scheme: "file",
      path: context.asAbsolutePath("./template"),
    });
    const templateUri: vscode.Uri = vscode.Uri.joinPath(rootPath, name);
    return vscode.workspace.fs.readFile(templateUri).then((array) => {
      return array.toString();
    });
  }

  writeFile(
    context: vscode.ExtensionContext,
    fileUri: vscode.Uri,
    content: string
  ): Thenable<vscode.TextEditor> {
    return vscode.workspace.fs
      .writeFile(fileUri, Buffer.from(content))
      .then((f) => {
        return vscode.workspace.fs.stat(fileUri);
      })
      .then((fileStat) => {
        console.debug("Saved file to " + fileUri.path);
        return vscode.workspace.openTextDocument(fileUri);
      })
      .then((document) => {
        return vscode.window.showTextDocument(document);
      });
  }
}
