namespace OpsIq.Core.Chunking;

public interface IChunker
{
    IReadOnlyList<string> Chunk(string text);
}