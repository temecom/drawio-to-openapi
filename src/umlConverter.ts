import * as vscode from "vscode";
import * as uml from "./umlEntities";
import * as gliffy from "./umlGliffyConverter";
import * as handleBarsGenerator from "./handlebarsCodeGenerator";

/**
 * A class to convert a Gliffy UML Document in '.gliffy' json form to a neutral UMLDefinition set
 */
export class UmlConverter {
  /**
   * Convert the open document to normalized UML form
   */
  convert(context: vscode.ExtensionContext): void {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    if (editor != null) {
      try {
        // TODO:  Only one converter so far - add optional converter selection
        const converter: uml.Converter = new gliffy.UmlConverter();
        const document = editor.document;
        const fileNameSegments = document.fileName.split(".")[0].split("/");
        const name = fileNameSegments[fileNameSegments.length - 1];
        this.convertDocument(context, document, name).then((doc) => {
          vscode.window.showTextDocument(doc);
        });
      } catch (e) {
        console.error("Failed to import code %s", e);
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
  convertDocument(
    context: vscode.ExtensionContext,
    document: vscode.TextDocument,
    name: string
  ): Thenable<vscode.TextDocument> {
    // TODO:  Only one converter so far - add optional converter selection
    const converter: uml.Converter = new gliffy.UmlConverter();
    const model: uml.ModelDefinition = converter.convert(
      document.getText(),
      name
    );
    // TODO: use file selector
    const baseUmlUri: vscode.Uri = vscode.Uri.from({
      scheme: "file",
      path: context.asAbsolutePath("generated/uml"),
    });
    const fileUri = vscode.Uri.joinPath(baseUmlUri, name + ".json");
    return vscode.workspace.fs
      .writeFile(fileUri, Buffer.from(JSON.stringify(model)))
      .then((file) => {
        return vscode.workspace.fs.stat(fileUri);
      })
      .then((fileStat) => {
        console.debug("Saved file to " + fileUri.path);
        return vscode.workspace.openTextDocument(fileUri);
      })
      .then((document) => {
        return document;
      });
  }

  /**
   * Generate working code from the UML Model for the open document
   * @param context
   */
  generate(context: vscode.ExtensionContext): void {
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
          const job: uml.GenerationJob = new uml.GenerationJob();

          job.definition = definition;
          job.templateName = "classTemplate";
          job.fileExtension = "java";
          job.path = "src/main/java";
          job.package = model.defaultPackage;
          void this.generateCodeFromJob(context, job).then((result) =>
            console.debug(result)
          );
        });
      } catch (e) {
        console.error("Failed to generate Java code %s", e);
        void vscode.window.showErrorMessage("Failed to generate Java code");
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
        const jobText: string = document.getText();
        const job: uml.UmlJob = JSON.parse(jobText) as uml.UmlJob;
        console.info("Executing job: %s", job.name);
        job.conversionJobs.forEach((conversionJob) => {
          console.info("Converting with job %s", conversionJob.name);
          this.convert(context);
        });
      } catch (e) {
        console.error("Failed to run job %s", e);
        void vscode.window.showErrorMessage("Failed to generate Java code");
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
  generateCodeFromJob(
    context: vscode.ExtensionContext,
    job: uml.GenerationJob
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
    const generator: uml.Generator =
      new handleBarsGenerator.HandlebarsCodeGenerator();
    return this.readTemplate(
      context,
      job.templateName + "." + job.fileExtension
    )
      .then((template) => {
        // Generate the code using the job
        job.template = template;
        return generator.generate(job);
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
