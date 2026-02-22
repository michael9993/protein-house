from graphql import GraphQLError
from graphql.language.ast import (
    Field,
    FragmentDefinition,
    FragmentSpread,
    InlineFragment,
    OperationDefinition,
)
from graphql.validation import validate
from graphql.validation.rules.base import ValidationRule
from graphql.validation.validation import ValidationContext


class DepthValidator(ValidationRule):
    """Validates that GraphQL queries don't exceed maximum nesting depth.

    Walks the AST and measures the maximum field nesting depth. Fragment
    spreads are resolved inline with a seen-set to prevent infinite recursion
    from circular fragment references.
    """

    def __init__(self, max_depth: int):
        self.max_depth = max_depth
        self._fragments: dict[str, FragmentDefinition] = {}
        self._depth_exceeded = False

    def __call__(self, context: ValidationContext):
        self.context = context

        # Pre-collect all fragment definitions from the document.
        for definition in context.get_ast().definitions:
            if isinstance(definition, FragmentDefinition):
                self._fragments[definition.name.value] = definition

        return self

    def _measure_depth(
        self,
        node,
        depth: int = 0,
        seen_fragments: set | None = None,
    ) -> int:
        if seen_fragments is None:
            seen_fragments = set()

        selection_set = getattr(node, "selection_set", None)
        if not selection_set:
            return depth

        max_depth = depth
        for selection in selection_set.selections:
            if isinstance(selection, Field):
                child = self._measure_depth(selection, depth + 1, seen_fragments)
                max_depth = max(max_depth, child)
            elif isinstance(selection, InlineFragment):
                # Inline fragments don't add depth — they are type refinements.
                child = self._measure_depth(selection, depth, seen_fragments)
                max_depth = max(max_depth, child)
            elif isinstance(selection, FragmentSpread):
                name = selection.name.value
                if name not in seen_fragments:
                    seen_fragments.add(name)
                    fragment = self._fragments.get(name)
                    if fragment:
                        child = self._measure_depth(
                            fragment, depth, seen_fragments
                        )
                        max_depth = max(max_depth, child)

        return max_depth

    def enter(self, node, key, parent, path, ancestors):
        if isinstance(node, OperationDefinition):
            depth = self._measure_depth(node)
            if depth > self.max_depth:
                self._depth_exceeded = True
                self.context.report_error(
                    GraphQLError(
                        f"Query depth {depth} exceeds maximum allowed depth "
                        f"of {self.max_depth}.",
                        [node],
                    )
                )


def depth_validator(max_depth: int) -> DepthValidator:
    """Create a DepthValidator instance configured with the given limit."""
    return DepthValidator(max_depth=max_depth)


def validate_query_depth(schema, query, max_depth: int):
    """Validate that a query does not exceed the maximum allowed depth.

    Returns a list of errors (empty if validation passes).
    """
    validator = depth_validator(max_depth)
    errors = validate(
        schema,
        query.document_ast,
        [validator],  # type: ignore[list-item] # depth validator is an instance that pretends to be a class  # noqa: E501
    )
    return errors
