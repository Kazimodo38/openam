/**
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2016 ForgeRock AS.
 */

define("org/forgerock/openam/ui/admin/services/SitesService", [
    "lodash",
    "org/forgerock/commons/ui/common/main/AbstractDelegate",
    "org/forgerock/commons/ui/common/util/Constants",
    "org/forgerock/openam/ui/common/models/JSONSchema",
    "org/forgerock/openam/ui/common/models/JSONValues"
], (_, AbstractDelegate, Constants, JSONSchema, JSONValues) => {

    const obj = new AbstractDelegate(`${Constants.host}/${Constants.context}/json/global-config/`);

    const filterUnEditableProperties = (data) => _.pick(data, ["url", "secondaryURLs"]);

    const getSchema = () => obj.serviceCall({
        url: "sites?_action=schema",
        headers: { "Accept-API-Version": "protocol=1.0,resource=1.0" },
        type: "POST",
        success: (data) => {
            const filteredProperties = filterUnEditableProperties(data.properties);
            data.properties = filteredProperties;
            return data;
        }
    });

    const getValues = (id) => obj.serviceCall({
        url: `sites/${id}`,
        headers: { "Accept-API-Version": "protocol=1.0,resource=1.0" },
        success: (data, jqXHR) => {
            data.etag = jqXHR.getResponseHeader("ETag");
            return data;
        }
    });

    const getTemplate = () =>
        obj.serviceCall({
            url: "sites?_action=template",
            headers: { "Accept-API-Version": "protocol=1.0,resource=1.0" },
            type: "POST"
        });

    obj.sites = {
        getAll: () =>
            obj.serviceCall({
                url: "sites?_queryFilter=true",
                headers: { "Accept-API-Version": "protocol=1.0,resource=1.0" }
            }).then((data) => _.sortBy(data.result, "_id")),
        get: (id) =>
            Promise.all([getSchema(), getValues(id)]).then((response) => ({
                schema: new JSONSchema(response[0]),
                values: new JSONValues(response[1])
            })),
        create: (data) =>
            obj.serviceCall({
                url: `sites?_action=create`,
                headers: { "Accept-API-Version": "protocol=1.0,resource=1.0" },
                type: "POST",
                data: JSON.stringify(_.omit(data, ["servers"]))
            }),
        update: (id, data, etag) =>
            obj.serviceCall({
                url: `sites/${id}`,
                headers: { "Accept-API-Version": "protocol=1.0,resource=1.0", "If-Match": etag },
                type: "PUT",
                data: JSON.stringify(filterUnEditableProperties(data))
            }),
        remove: (id, etag) =>
            obj.serviceCall({
                url: `sites/${id}`,
                headers: { "Accept-API-Version": "protocol=1.0,resource=1.0", "If-Match": etag },
                type: "DELETE"
            }),
        getInitialState: () =>
            Promise.all([getSchema(), getTemplate()]).then((response) => ({
                schema: new JSONSchema(response[0]),
                values: new JSONValues(response[1])
            }))
    };

    return obj;
});
