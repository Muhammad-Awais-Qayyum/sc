import mongoose, { Document, Schema, Model } from "mongoose";

// interface for faqQuestion

interface IFaqQusetion extends Document {
    question: string;
    answer: string;
}

// interface for category

interface ICategory extends Document {
    title: string;
}

// interface for banner image

interface IBannerImage extends Document {
    public_id: string; // bcz we save image in cloudinary
    url: string;
}

// interface for Layout all interface in used in layout

interface ILayout extends Document {
    type: string;
    faq: IFaqQusetion[];
    categories: ICategory[];
    banner: {
        image: IBannerImage;
        title: string;
        subtitle: string;
    };
}

// faq schema

const faqSchema = new Schema<IFaqQusetion>({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
});

// category schema

const categorySchema = new Schema<ICategory>({
    title: {
        type: String,
    },
});

//  BANNER SCHEMA

const bannerSchema = new Schema<IBannerImage>({
    public_id: String,
    url: String,
});

// layout schema
const layoutSchema = new Schema<ILayout>({
    type: String,
    faq: [faqSchema],
    categories: [categorySchema],
    banner: {
        image: bannerSchema,
        title: String,
        subTitle: String,
    },
});


const Layout: Model<ILayout> = mongoose.model("Layout", layoutSchema)

export default Layout;