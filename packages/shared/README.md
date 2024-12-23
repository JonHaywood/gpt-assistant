# Shared Code Library

This package is for code shared betwen the assistant and the web app.

## Usage

Code that can be run on the client or the server is exported directly
by the package. For example:

```
import { something } from "shared";

```

Code that can only be run on the server needs to imported manually from
the server file. For example:

```
import { something } from "shared/src/server";
```