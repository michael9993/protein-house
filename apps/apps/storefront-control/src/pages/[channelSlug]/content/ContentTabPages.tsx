import { Box, Text, Button } from "@saleor/macaw-ui";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import type { ContentTabPagesProps } from "./types";

export function ContentTabPages({ register, errors, control, faqFields, addFaq, removeFaq }: ContentTabPagesProps) {
  return (
    <>
      <SectionCard
        id="content-contact"
        title="Contact Page"
        description="Text for the contact page including form labels, placeholders, and messages"
        keywords={["contact", "form", "message", "faq", "follow us"]}
        icon="📧"
      >
        <Text marginTop={6} marginBottom={3}>
          Hero Section
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Hero Title"
            name="contact.heroTitle"
            register={register}
            errors={errors}
            placeholder="Get in Touch"
          />
          <FormField
            label="Hero Description"
            name="contact.heroDescription"
            register={register}
            errors={errors}
            placeholder="Have a question or need help? We're here for you. Reach out through any of the channels below or fill out the contact form."
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Contact Method Labels
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Email Label"
            name="contact.emailLabel"
            register={register}
            errors={errors}
            placeholder="Email"
            description="Label for email contact method"
          />
          <FormField
            label="Phone Label"
            name="contact.phoneLabel"
            register={register}
            errors={errors}
            placeholder="Phone"
            description="Label for phone contact method"
          />
          <FormField
            label="Address Label"
            name="contact.addressLabel"
            register={register}
            errors={errors}
            placeholder="Address"
            description="Label for address contact method"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Contact Form
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Form Title"
            name="contact.formTitle"
            register={register}
            errors={errors}
            placeholder="Send Us a Message"
          />
          <FormField
            label="Form Description"
            name="contact.formDescription"
            register={register}
            errors={errors}
            placeholder="We'll get back to you within 24 hours."
          />
          <FormField
            label="Name Label"
            name="contact.nameLabel"
            register={register}
            errors={errors}
            placeholder="Your Name"
          />
          <FormField
            label="Name Placeholder"
            name="contact.namePlaceholder"
            register={register}
            errors={errors}
            placeholder="John Doe"
          />
          <FormField
            label="Email Label (Form)"
            name="contact.emailLabelForm"
            register={register}
            errors={errors}
            placeholder="Email Address"
            description="Label for email field in contact form"
          />
          <FormField
            label="Email Placeholder"
            name="contact.emailPlaceholder"
            register={register}
            errors={errors}
            placeholder="john@example.com"
          />
          <FormField
            label="Subject Label"
            name="contact.subjectLabel"
            register={register}
            errors={errors}
            placeholder="Subject"
          />
          <FormField
            label="Subject Placeholder"
            name="contact.subjectPlaceholder"
            register={register}
            errors={errors}
            placeholder="How can we help?"
          />
          <FormField
            label="Message Label"
            name="contact.messageLabel"
            register={register}
            errors={errors}
            placeholder="Message"
          />
          <FormField
            label="Message Placeholder"
            name="contact.messagePlaceholder"
            register={register}
            errors={errors}
            placeholder="Tell us more about your inquiry..."
          />
          <FormField
            label="Send Button"
            name="contact.sendButton"
            register={register}
            errors={errors}
            placeholder="Send Message"
          />
          <FormField
            label="Sending Button (Loading)"
            name="contact.sendingButton"
            register={register}
            errors={errors}
            placeholder="Sending..."
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Success Message
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Success Title"
            name="contact.successTitle"
            register={register}
            errors={errors}
            placeholder="Message Sent!"
          />
          <FormField
            label="Success Description"
            name="contact.successDescription"
            register={register}
            errors={errors}
            placeholder="Thank you for reaching out. We'll be in touch soon."
          />
          <FormField
            label="Send Another Message Link"
            name="contact.sendAnotherMessage"
            register={register}
            errors={errors}
            placeholder="Send another message"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          FAQs Section
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="FAQs Title"
            name="contact.faqsTitle"
            register={register}
            errors={errors}
            placeholder="Frequently Asked Questions"
          />
          <FormField
            label="FAQs Description"
            name="contact.faqsDescription"
            register={register}
            errors={errors}
            placeholder="Find quick answers to common questions."
          />
          <FormField
            label="View All FAQs Link"
            name="contact.viewAllFaqs"
            register={register}
            errors={errors}
            placeholder="View All FAQs"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          FAQ Items
        </Text>
        <Box marginBottom={6}>
          {faqFields.map((field, index) => (
            <Box
              key={field.id}
              marginBottom={4}
              padding={4}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginBottom={3}
              >
                <Text>FAQ #{index + 1}</Text>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => removeFaq(index)}
                  style={{ color: "#dc2626" }}
                >
                  Remove
                </Button>
              </Box>
              <Box display="grid" __gridTemplateColumns="1fr" gap={4}>
                <FormField
                  label="Question"
                  name={`contact.faqs.${index}.question`}
                  register={register}
                  errors={errors}
                  placeholder="What are your shipping times?"
                />
                <FormField
                  label="Answer"
                  name={`contact.faqs.${index}.answer`}
                  register={register}
                  errors={errors}
                  placeholder="Most orders ship within 24 hours. Standard delivery takes 3-5 business days..."
                />
              </Box>
            </Box>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => addFaq({ question: "", answer: "" })}
          >
            Add FAQ
          </Button>
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Social Section
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Follow Us Title"
            name="contact.followUsTitle"
            register={register}
            errors={errors}
            placeholder="Follow Us"
          />
          <FormField
            label="Follow Us Description"
            name="contact.followUsDescription"
            register={register}
            errors={errors}
            placeholder="Stay connected for updates, tips, and exclusive offers."
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-wishlist"
        title="Wishlist Page"
        description="Wishlist page text"
        keywords={["wishlist", "saved"]}
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="My Wishlist Title"
            name="wishlist.myWishlistTitle"
            register={register}
            errors={errors}
            placeholder="My Wishlist"
          />
          <FormField
            label="Items Count"
            name="wishlist.itemsCount"
            register={register}
            errors={errors}
            placeholder="{count} item(s) saved"
          />
          <FormField
            label="Loading Wishlist"
            name="wishlist.loadingWishlist"
            register={register}
            errors={errors}
            placeholder="Loading wishlist..."
          />
          <FormField
            label="Empty Wishlist Title"
            name="wishlist.emptyWishlistTitle"
            register={register}
            errors={errors}
            placeholder="Your wishlist is empty"
          />
          <FormField
            label="Empty Wishlist Message"
            name="wishlist.emptyWishlistMessage"
            register={register}
            errors={errors}
            placeholder="Save items you love..."
          />
          <FormField
            label="Discover Products Button"
            name="wishlist.discoverProductsButton"
            register={register}
            errors={errors}
            placeholder="Discover Products"
          />
          <FormField
            label="Clear All Button"
            name="wishlist.clearAllButton"
            register={register}
            errors={errors}
            placeholder="Clear All"
          />
          <FormField
            label="Items Saved"
            name="wishlist.itemsSaved"
            register={register}
            errors={errors}
            placeholder="{count} item(s) saved"
          />
          <FormField
            label="View Product"
            name="wishlist.viewProduct"
            register={register}
            errors={errors}
            placeholder="View Product"
          />
          <FormField
            label="Out of Stock"
            name="wishlist.outOfStock"
            register={register}
            errors={errors}
            placeholder="Out of Stock"
          />
          <FormField
            label="Added On"
            name="wishlist.addedOn"
            register={register}
            errors={errors}
            placeholder="Added {date}"
          />
          <FormField
            label="Remove From Wishlist"
            name="wishlist.removeFromWishlist"
            register={register}
            errors={errors}
            placeholder="Remove"
          />
          <FormField
            label="Remove From Wishlist Tooltip"
            name="wishlist.removeFromWishlistTooltip"
            register={register}
            errors={errors}
            placeholder="Remove from wishlist"
          />
          <FormField
            label="Move to Cart"
            name="wishlist.moveToCart"
            register={register}
            errors={errors}
            placeholder="Add to Cart"
          />
        </Box>
      </SectionCard>

    </>
  );
}

