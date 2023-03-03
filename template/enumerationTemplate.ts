/*
* Autogenerated ts file: {{definition.name}}.ts
* @date: {{date}}
* @source: {{model.source.fileName}}
* @copyright: {{copyright}}
*/ 


// Imports

/**
* Class definition for {{definition.name}}
*/
export enum {{definition.name}}
    {{#if definition.superClass}}extends {{definition.superClass}}{{/if}} {

    // Attributes
{{#each definition.attributes as |attribute|}}
    {{attribute.name}};
{{/each}}

    // Methods

{{#each  definition.methods as |method|}}
    private {{method.name}} ({{method.parameters}}): {{method.returnType}}  {
        {{method.code}}
    }
{{/each}}
}