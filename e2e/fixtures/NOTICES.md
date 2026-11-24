# Third-Party License Notices

Full license texts for the vendored fixture portions in this directory, copied verbatim from the pinned upstream commits recorded in [README.md](./README.md). The BSD 3-clause license requires its notice to accompany the redistributed portions.

## oas/schemas/ — OAI/OpenAPI-Specification (iterations pinned in oas/sources.json)

Licensed under Apache-2.0; the license requires no notice reproduction for unmodified redistribution beyond attribution, recorded in [README.md](./README.md) with the upstream LICENSE link. This includes the Swagger 2.0 schema (`oas/schemas/2.0/schema.json`), which is byte-identical to `schemas/v2.0/schema.json` at commit e77481c of the same repository.

## oas/documents/ — OAI/OpenAPI-Specification (commits pinned in oas/sources.json)

Licensed under Apache-2.0; the license requires no notice reproduction for unmodified redistribution beyond attribution, recorded in [README.md](./README.md) with the upstream LICENSE link and the pinned commit of each branch. The Swagger 2.0 example documents (`oas/documents/2.0/`) are taken from commit e77481c, the last commit of this repository before its `examples/` folder was removed; the same files in OAI/learn.openapis.org are licensed CC-BY-4.0 and were deliberately not used, so no CC-BY attribution applies. The `info.license` members inside those documents describe the Petstore API they model, not the files.

## oas/schemas/json-schema-2020-12/ and oas/schemas/json-schema-draft-04/ — json-schema-org/json-schema-spec (LICENSE at commit 4e87b91)

The upstream repository is [licensed](https://github.com/json-schema-org/json-schema-spec/blob/4e87b9141e62483383987ddbd27947f1c484b905/LICENSE) under either the BSD 3-clause license or the Academic Free License v3.0. These unmodified files are redistributed under the BSD 3-clause option; its full text, copied verbatim from the upstream `LICENSE` at the commit above, follows. The draft-04 meta-schema (`oas/schemas/json-schema-draft-04/schema.json`) is the same kind of file from the same project: its `draft-04` branch has no LICENSE file, and the LICENSE of [json-schema-org/website](https://github.com/json-schema-org/website/blob/a2d03f7db807a759aa6bc61a8792e5452dc996e8/LICENSE), the repository that serves it at json-schema.org, is byte-identical to the `LICENSE` above (BSD 3-clause or AFL-3.0, Copyright (c) 2022 JSON Schema Specification Authors), so the notice below accompanies that file too.

> Copyright (c) 2022 JSON Schema Specification Authors
> 
> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the following conditions are
> met:
> 
> 1. Redistributions of source code must retain the above copyright
> notice, this list of conditions and the following disclaimer.
> 
> 2. Redistributions in binary form must reproduce the above copyright
> notice, this list of conditions and the following disclaimer in the
> documentation and/or other materials provided with the distribution.
> 
> 3. Neither the name of the copyright holder nor the names of its
> contributors may be used to endorse or promote products derived from
> this software without specific prior written permission.
> 
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
> "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
> LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
> A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
> HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
> SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
> TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
> PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
> LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
> NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
> SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
