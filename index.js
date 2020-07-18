const fs = require('fs');
const core = require('@actions/core');
const Handlebars = require('handlebars');
const { format } = require('date-fns');

const SDK = require('@yuque/sdk');

const defaultTemplate = `
{{#each record}}
  - [{{title}} ({{short createdAt format="MMMM dd, YYYY"}})](https://buzhou.top/blogs/{{slug}})
{{/each}}
`;

Handlebars.registerHelper('short', function (date, options) {
  return format(new Date(date), options && options.format || 'MMMM dd');
});

(async function () {
  try {
    const yuqueToken = core.getInput('yuque-token');
    const namespace = core.getInput('yuque-namespace');
    const yuqueTemplateFile = core.getInput('yuque-template-file') || '';
    const yuqueOutputFile = core.getInput('yuque-output-file') || 'README.md';
    const publicOnly = core.getInput('yuque-doc-public-only');

    const client = new SDK({ token: yuqueToken });

    const docs = await client.docs.list({ namespace });

    console.log('list docs', docs);
    const filteredDocs = docs.filter(doc => (publicOnly ? !!doc.public : true));

    const templateContent = fs.existsSync(yuqueTemplateFile) ?  fs.readFileSync(yuqueTemplateFile, 'utf-8') : defaultTemplate;
    const fileTemplate = Handlebars.compile(templateContent);

    fs.writeFileSync(yuqueOutputFile, fileTemplate({ namespace, record: filteredDocs }));

  } catch (e) {
    core.setFailed(e.message);
  }
})();
