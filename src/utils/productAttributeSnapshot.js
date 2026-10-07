const readAttributeValue = (entry) => {
    const nested = entry?.attribute || entry?.product_attribute || entry?.pivot || {};
    const value = entry?.value ?? entry?.attribute_value ?? entry?.attributeValue ??
        entry?.pivot?.value ?? entry?.pivot?.attribute_value ?? nested.value ?? nested.attribute_value;
    const id = entry?.attribute_id ?? entry?.attributeId ?? entry?.attribute?.id ??
        entry?.product_attribute?.id ?? entry?.pivot?.attribute_id ?? nested.attribute_id;
    const name = entry?.attribute_name ?? entry?.attribute?.name ??
        entry?.product_attribute?.name ?? nested.name ?? entry?.name;
    return { id, name, value };
};

/** Convert product attribute API values into a stable, named transaction snapshot. */
export const createProductAttributeSnapshot = (values, groups = []) => {
    const source = Array.isArray(values) ? values :
        Array.isArray(values?.values) ? values.values : values;
    const entries = Array.isArray(source)
        ? source
        : Object.entries(source || {}).map(([id, entry]) => (
            entry && typeof entry === 'object'
                ? { attribute_id: id, ...entry }
                : { attribute_id: id, value: entry }
        ));
    const attributes = (groups || []).flatMap((group) => group.attributes || []);

    return entries.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return [];
        const { id, name, value } = readAttributeValue(entry);
        if (value === null || value === undefined || String(value).trim() === '') return [];
        const attribute = attributes.find((item) => String(item.id) === String(id)) ||
            attributes.find((item) => name && item.name?.toLowerCase() === String(name).toLowerCase());
        const attributeName = name || attribute?.name || (id != null ? `Attribute ${id}` : 'Attribute');
        return [{
            ...(id != null ? { attribute_id: id } : {}),
            attribute_name: attributeName,
            value: String(value),
        }];
    });
};

export const getItemAttributeSnapshot = (item) => {
    if (Array.isArray(item?.attributes) && item.attributes.length) return item.attributes;
    if (Array.isArray(item?.attribute_values) && item.attribute_values.length) return item.attribute_values;
    return Array.isArray(item?.attributes) ? item.attributes :
        Array.isArray(item?.attribute_values) ? item.attribute_values : [];
};
