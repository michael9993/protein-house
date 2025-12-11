# Backend Extensions

This directory is for custom Saleor extensions and plugins.

## Structure

If you need to extend Saleor functionality, create your customizations here:

```
backend/
├── plugins/          # Custom Saleor plugins
├── extensions/       # Django app extensions
└── migrations/       # Custom database migrations
```

## Best Practices

- **Never modify Saleor core directly**
- Create plugins for custom functionality
- Use Django apps for extensions
- Follow Saleor plugin development guidelines

## Resources

- [Saleor Plugin Development](https://docs.saleor.io/docs/3.x/developer/plugins)
- [Saleor Extensions](https://docs.saleor.io/docs/3.x/developer/extending)

