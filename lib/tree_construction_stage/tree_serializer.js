var defaultTreeAdapter = require('../tree_adapters/default'),
    HTML = require('../const/html');

//Aliases
var $ = HTML.TAG_NAMES,
    NS = HTML.NAMESPACES;


//Escaping regexes
var AMP_REGEX = /&/g,
    NBSP_REGEX = /\u00a0/g,
    DOUBLE_QUOTE_REGEX = /"/g,
    LT_REGEX = /</g,
    GT_REGEX = />/g;


//Escape string
function escapeString(str, attrMode) {
    str = str
        .replace(AMP_REGEX, '&amp;')
        .replace(NBSP_REGEX, '&nbsp;');

    if (attrMode)
        str = str.replace(DOUBLE_QUOTE_REGEX, '&quot;');

    else {
        str = str
            .replace(LT_REGEX, '&lt;')
            .replace(GT_REGEX, '&gt;');
    }

    return str;
}


//TreeSerializer
var TreeSerializer = module.exports = function (treeAdapter) {
    this.treeAdapter = treeAdapter || defaultTreeAdapter;
};


//API
TreeSerializer.prototype.serialize = function (node) {
    this.html = '';
    this._serializeChildNodes(node);

    return this.html;
};


//Internals
TreeSerializer.prototype._serializeChildNodes = function (parentNode) {
    var childNodes = this.treeAdapter.getChildNodes(parentNode);

    if (childNodes) {
        for (var i = 0, cnLength = childNodes.length; i < cnLength; i++) {
            var currentNode = childNodes[i];

            if (this.treeAdapter.isElementNode(currentNode))
                this._serializeElement(currentNode);

            else if (this.treeAdapter.isTextNode(currentNode))
                this._serializeTextNode(currentNode);

            else if (this.treeAdapter.isCommentNode(currentNode))
                this._serializeCommentNode(currentNode);

            else if (this.treeAdapter.isDocumentTypeNode(currentNode))
                this._serializeDocumentTypeNode(currentNode);
        }
    }
};

TreeSerializer.prototype._serializeElement = function (node) {
    var tn = this.treeAdapter.getTagName(node),
        ns = this.treeAdapter.getNamespaceURI(node),
        qualifiedTn = (ns === NS.HTML || ns === NS.SVG || ns === NS.MATHML) ? tn : (ns + ':' + tn);

    this.html += '<' + qualifiedTn;
    this._serializeAttributes(node);
    this.html += '>';

    if (tn !== $.AREA && tn !== $.BASE && tn !== $.BASEFONT && tn !== $.BGSOUND && tn !== $.BR && tn !== $.BR &&
        tn !== $.COL && tn !== $.EMBED && tn !== $.FRAME && tn !== $.HR && tn !== $.IMG && tn !== $.INPUT &&
        tn !== $.KEYGEN && tn !== $.LINK && tn !== $.MENUITEM && tn !== $.META && tn !== $.PARAM && tn !== $.SOURCE &&
        tn !== $.TRACK && tn !== $.WBR) {

        if (tn === $.PRE || tn === $.TEXTAREA || tn === $.LISTING) {
            var firstChild = this.treeAdapter.getFirstChild(node);

            if (firstChild && this.treeAdapter.isTextNode(firstChild))
                this.html += '\n';
        }

        this._serializeChildNodes(node);
        this.html += '</' + qualifiedTn + '>';
    }
};

TreeSerializer.prototype._serializeAttributes = function (node) {
    var attrs = this.treeAdapter.getAttrList(node);

    for (var i = 0, attrsLength = attrs.length; i < attrsLength; i++) {
        var attr = attrs[i];

        this.html += ' ';

        if (!attr.namespace)
            this.html += attr.name;

        else if (attr.namespace === NS.XML)
            this.html += 'xml:' + attr.name;

        else if (attr.namespace === NS.XMLNS) {
            if (attr.name !== 'xmlns')
                this.html += 'xmlns:';

            this.html += attr.name;
        }

        else if (attr.namespace === NS.XLINK)
            this.html += 'xlink:' + attr.name;

        else
            this.html += attr.namespace + ':' + attr.name;

        this.html += '="' + escapeString(attr.value, true) + '"';
    }
};

TreeSerializer.prototype._serializeTextNode = function (node) {
    var parent = this.treeAdapter.getParentNode(node),
        parentTn = parent && this.treeAdapter.getTagName(parent),
        content = this.treeAdapter.getTextNodeContent(node);

    if (parentTn === $.STYLE || parentTn === $.SCRIPT || parentTn === $.XMP || parentTn === $.IFRAME ||
        parentTn === $.NOEMBED || parentTn === $.NOFRAMES || parentTn === $.PLAINTEXT || parentTn === $.NOSCRIPT) {
        this.html += content;
    }

    else
        this.html += escapeString(content, false);
};

TreeSerializer.prototype._serializeCommentNode = function (node) {
    this.html += '<!--' + this.treeAdapter.getCommentNodeContent(node) + '-->';
};

TreeSerializer.prototype._serializeDocumentTypeNode = function (node) {
    var name = this.treeAdapter.getDocumentTypeNodeName(node),
        publicId = this.treeAdapter.getDocumentTypeNodePublicId(node),
        systemId = this.treeAdapter.getDocumentTypeNodeSystemId(node);

    this.html += '<!DOCTYPE ' + name;

    if (publicId !== null)
        this.html += ' PUBLIC "' + publicId + '"';


    if (systemId !== null)
        this.html += ' "' + systemId + '"';

    this.html += '>';
};

