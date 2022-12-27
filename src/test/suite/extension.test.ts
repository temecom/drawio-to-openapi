
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
  void vscode.window.showInformationMessage('Start all tests.')

  test('When extension is loaded then welcome is shown', () => {
    void vscode.commands.executeCommand('uml-tools:welcome')
  })
})
