import * as admin from "firebase-admin";
import {divider, editableActionLine, listFooter, markdownSection} from "./view";

export const getActionItemMenu = (collectionPath: string, firestore: admin.firestore.Firestore) => {
    return firestore.collection(collectionPath)
        .get()
        .then((snapshot) => {
            const itemBlocks = snapshot.docs.map((doc) => {
                return editableActionLine(`${doc.data().description}`, doc.id);
            });

            return [
                markdownSection("Here are all open action items:"),
                divider(),
                ...itemBlocks,
                listFooter()
            ];
        });
};