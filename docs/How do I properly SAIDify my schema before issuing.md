<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# How do I properly SAIDify my schema before issuing credentials in signify-ts

To properly **SAIDify your schema before issuing credentials in signify-ts**, you need to compute a self-addressing identifier (SAID) for your schema JSON. This SAID is a cryptographic hash that uniquely and verifiably identifies the schema content. Here are the main points and steps to accomplish this:

1. **What is SAIDification?**
SAIDification means computing a cryptographic hash of your schema content (usually using Blake3 hashing) and setting that hash as the `$id` or `said` property on your schema JSON. This makes the schema self-addressable and tamper-evident.
2. **Schema Structure and SAID**
    - Your schema should be a JSON object following the ACDC (Attributed Credential Data Container) format with certain required fields like `$id` (the SAID), `$schema` (typically set to the JSON Schema draft URI), `title`, `properties` describing data attributes, and possibly metadata for credential issuance.
    - The top-level `$id` is the SAID of the schema, which can only be computed after all nested dependent blocks are computed (if any).
3. **How to SAIDify your schema in signify-ts or Veridian ecosystem**:
    - Use a "saidify" utility function if provided by your SDK or libraries (e.g., signify-ts may expose a `Saider.saidify()` function). This utility takes your JSON schema object and computes and sets the SAID on it.
    - Alternatively, use Veridian CLI tools or scripts designed to saidify schemes in the KERI/ACDC ecosystem if you are working in a CLI environment. These tools hash your schema and inject the `$id` field automatically.
4. **After SAIDification**:
    - The schema object now has a valid `$id` (the SAID). You use this `$id` as the `s` field value when issuing credentials referencing this schema.
    - This prevents errors like `INVALID_SCHEMA_SAID` or `SCHEMA_NOT_FOUND`.
5. **Example workflow**:

```js
import { Saider } from 'signify-ts'; // if available

const originalSchema = {
  title: 'Example Credential',
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' }
  },
  required: ['name', 'age'],
  $schema: 'http://json-schema.org/draft-07/schema#'
};

// SAIDify the schema
const saidifiedSchema = Saider.saidify(originalSchema);

console.log(saidifiedSchema.$id); // This is the schema SAID you use to issue credentials
```

If `Saider.saidify()` is not directly available, consult Veridian or signify-ts documentation or CLI tools for saidification commands.
6. **Important notes**:
    - Always ensure the saidified schema is stored or referenced properly by your agent or registry before attempting credential issuance.
    - Avoid using placeholder or custom IDs like `"custom"`; always use the real SAID.

This process aligns with the ACDC/KERI design for secure and verifiable credential schemas by making the schema content self-authenticating via its SAID[^1].

If you want, I can help provide exact code snippets or CLI commands based on your environment details.

[^1]: This is based on the ACDC credential schema design and its SAIDification approach explained in tutorials such as KERI/ACDC credential issuance workflows and signify-ts usage examples.

<div style="text-align: center">⁂</div>

[^1]: https://kentbull.com/2023/03/09/keri-tutorial-series-treasure-hunting-in-abydos-issuing-and-verifying-a-credential-acdc/

[^2]: https://github.com/WebOfTrust/signify-ts

[^3]: https://www.prisma.io/llms-full.txt

[^4]: https://github.com/WebOfTrust/signify-ts/issues

