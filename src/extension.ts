// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as umlConverter from './umlConverter'; 

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "uml-tools" is now active!');

	// Welcome Message
	let disposable = vscode.commands.registerCommand('uml-tools.welcome', () => {
		vscode.window.showInformationMessage('Welcome to VS UML Tools!');
	});
	context.subscriptions.push(disposable);

	// File conversion
	disposable = vscode.commands.registerCommand('uml-tools.convert', () => {
		
		var converter:umlConverter.UmlConverter = new umlConverter.UmlConverter(); 
		converter.convert(context); 
	});
	context.subscriptions.push(disposable);

	// File conversion
	disposable = vscode.commands.registerCommand('uml-tools.generate', () => {
	
		var converter:umlConverter.UmlConverter = new umlConverter.UmlConverter(); 
		converter.generate(context); 
	});
	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
export function deactivate() {}
