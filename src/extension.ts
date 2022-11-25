// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as umlConverter from './umlConverter'; 

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "drawio-uml" is now active!');

	// Welcome Message
	let disposable = vscode.commands.registerCommand('drawio-uml.welcome', () => {
		vscode.window.showInformationMessage('Welcome to drawio-uml!');
	});
	context.subscriptions.push(disposable);

	// File conversion
	disposable = vscode.commands.registerCommand('drawio-uml.convert', () => {
		
		var converter:umlConverter.UmlConverter = new umlConverter.UmlConverter(); 
		converter.convert(); 
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
