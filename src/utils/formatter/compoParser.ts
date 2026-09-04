import { Container, MediaGallery, MediaGalleryItem, Section, Separator, TextDisplay, Thumbnail } from "seyfert";

interface BCO {
  fileName?: string;
  guildIcon?: string;
}

export function buildV2Container(fText: string, opt?: BCO): Container {
  const container = new Container();

  if (opt?.fileName) {
    container.addComponents(
      new MediaGallery().addItems(
        new MediaGalleryItem().setMedia(`attachment://${opt.fileName}`)
      )
    );

    container.addComponents(new Separator());
  }

  const parts = fText.split(/\{separator\}/i);

  parts.forEach((p, i) => {
    const trim = p.trim();

    if (trim.length > 0) {
      if (i === 0 && opt?.guildIcon) {
        container.addComponents(
          new Section()
            .addComponents(new TextDisplay().setContent(trim))
            .setAccessory(
              new Thumbnail().setMedia(opt.guildIcon)
            )
        )
      } else {
        container.addComponents(
          new TextDisplay().setContent(trim)
        )
      }
    }

    if (i < parts.length - 1) {
      container.addComponents(
        new Separator()
      )
    }
  });

  return container;
}
